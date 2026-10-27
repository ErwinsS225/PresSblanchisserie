import { create } from 'zustand';
import { BLANCHISSERIE_PRICES, DEFAULT_FORFAITS, PRESSING_PRICES } from '../data/catalog';
import type { ForfaitConfig, ItemPanier, ModeFacturation, PrestationBlanchisserie, PrestationPressing, ServiceType, TypeVetement } from '../types';

type SettingsSnapshot = {
  tarifKilo: number;
  forfaitConfigs: Record<PrestationBlanchisserie, ForfaitConfig>;
  tarifsPressing: typeof PRESSING_PRICES;
  tarifsBlanchisserie: typeof BLANCHISSERIE_PRICES;
};
type OrderState = SettingsSnapshot & {
  serviceActif: ServiceType;
  modeFacturation: ModeFacturation;
  prestationPressing: PrestationPressing;
  prestationBlanchisserie: PrestationBlanchisserie;
  panier: ItemPanier[];
  poidsKilo: number;
  setService: (service: ServiceType) => void;
  setModeFacturation: (mode: ModeFacturation) => void;
  setPrestationPressing: (prestation: PrestationPressing) => void;
  setPrestationBlanchisserie: (prestation: PrestationBlanchisserie) => void;
  setForfaitConfig: (prestation: PrestationBlanchisserie, config: ForfaitConfig) => void;
  setTarifKilo: (tarif: number) => void;
  setTarifUnitaire: (service: ServiceType, prestation: string, vetementId: string, tarif: number) => void;
  ajouterVetement: (vetement: TypeVetement) => void;
  retirerVetement: (vetementId: string) => void;
  setPoids: (poids: number) => void;
  resetCommande: () => void;
  calculerTotal: () => number;
  nombrePieces: () => number;
};

const SETTINGS_KEY = 'pressblanchisserie:settings';
const initialSettings: SettingsSnapshot = { tarifKilo: 1600, forfaitConfigs: { ...DEFAULT_FORFAITS }, tarifsPressing: structuredClone(PRESSING_PRICES), tarifsBlanchisserie: structuredClone(BLANCHISSERIE_PRICES) };

function loadSettings(): SettingsSnapshot {
  if (typeof localStorage === 'undefined') return initialSettings;
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') as Partial<SettingsSnapshot>;
    return {
      tarifKilo: Number(raw.tarifKilo) > 0 ? Number(raw.tarifKilo) : initialSettings.tarifKilo,
      forfaitConfigs: { ...initialSettings.forfaitConfigs, ...raw.forfaitConfigs },
      tarifsPressing: mergePrices(initialSettings.tarifsPressing, raw.tarifsPressing),
      tarifsBlanchisserie: mergePrices(initialSettings.tarifsBlanchisserie, raw.tarifsBlanchisserie)
    };
  } catch { return initialSettings; }
}

function mergePrices<T extends Record<string, Record<string, number>>>(defaults: T, stored?: Partial<T>): T {
  return Object.fromEntries(Object.entries(defaults).map(([service, prices]) => [service, { ...prices, ...(stored?.[service] ?? {}) }])) as T;
}

function persistSettings(state: SettingsSnapshot) {
  if (typeof localStorage !== 'undefined') {
    try {
      const { tarifKilo, forfaitConfigs, tarifsPressing, tarifsBlanchisserie } = state;
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ tarifKilo, forfaitConfigs, tarifsPressing, tarifsBlanchisserie }));
    } catch { /* Le panier reste utilisable si le stockage du navigateur est indisponible. */ }
  }
}

const settings = loadSettings();
const initial = {
  ...settings,
  serviceActif: 'PRESSING' as ServiceType,
  modeFacturation: 'KILO' as ModeFacturation,
  prestationPressing: 'LAVAGE_REPASSAGE' as PrestationPressing,
  prestationBlanchisserie: 'LAVAGE_SIMPLE' as PrestationBlanchisserie,
  panier: [] as ItemPanier[],
  poidsKilo: 0
};

const priceFor = (state: Pick<OrderState, 'tarifsPressing' | 'tarifsBlanchisserie'>, service: ServiceType, prestation: string, vetementId: string) =>
  service === 'PRESSING'
    ? (state.tarifsPressing as Record<string, Record<string, number>>)[prestation]?.[vetementId] ?? 500
    : (state.tarifsBlanchisserie as Record<string, Record<string, number>>)[prestation]?.[vetementId] ?? 250;

/** Le panier garde toujours le détail des pièces, y compris pour la facturation au kilo. */
export const useOrderStore = create<OrderState>((set, get) => ({
  ...initial,
  setService: (serviceActif) => set((state) => {
    const prestation = serviceActif === 'PRESSING' ? state.prestationPressing : state.prestationBlanchisserie;
    return { serviceActif, modeFacturation: serviceActif === 'PRESSING' ? 'KILO' : 'UNITE', panier: state.panier.map((item) => ({ ...item, prixUnitaire: priceFor(state, serviceActif, prestation, item.vetement.id) })) };
  }),
  setModeFacturation: (modeFacturation) => set({ modeFacturation }),
  setPrestationPressing: (prestationPressing) => set((state) => ({ prestationPressing, panier: state.panier.map((item) => ({ ...item, prixUnitaire: priceFor(state, 'PRESSING', prestationPressing, item.vetement.id) })) })),
  setPrestationBlanchisserie: (prestationBlanchisserie) => set((state) => ({ prestationBlanchisserie, panier: state.panier.map((item) => ({ ...item, prixUnitaire: priceFor(state, 'BLANCHISSERIE', prestationBlanchisserie, item.vetement.id) })) })),
  setForfaitConfig: (prestation, config) => set((state) => { const next = { ...state, forfaitConfigs: { ...state.forfaitConfigs, [prestation]: config } }; persistSettings(next); return { forfaitConfigs: next.forfaitConfigs }; }),
  setTarifKilo: (tarifKilo) => set((state) => { const next = { ...state, tarifKilo }; persistSettings(next); return { tarifKilo }; }),
  setTarifUnitaire: (service, prestation, vetementId, tarif) => set((state) => {
    const tarifsPressing = service === 'PRESSING' ? { ...state.tarifsPressing, [prestation]: { ...state.tarifsPressing[prestation as PrestationPressing], [vetementId]: tarif } } : state.tarifsPressing;
    const tarifsBlanchisserie = service === 'BLANCHISSERIE' ? { ...state.tarifsBlanchisserie, [prestation]: { ...state.tarifsBlanchisserie[prestation as PrestationBlanchisserie], [vetementId]: tarif } } : state.tarifsBlanchisserie;
    const currentPrestation = service === 'PRESSING' ? state.prestationPressing : state.prestationBlanchisserie;
    const panier = service === state.serviceActif && currentPrestation === prestation ? state.panier.map((item) => item.vetement.id === vetementId ? { ...item, prixUnitaire: tarif } : item) : state.panier;
    const next = { ...state, tarifsPressing, tarifsBlanchisserie };
    persistSettings(next);
    return { tarifsPressing, tarifsBlanchisserie, panier };
  }),
  ajouterVetement: (vetement) => set((state) => {
    const index = state.panier.findIndex((item) => item.vetement.id === vetement.id);
    const prestation = state.serviceActif === 'PRESSING' ? state.prestationPressing : state.prestationBlanchisserie;
    const price = priceFor(state, state.serviceActif, prestation, vetement.id);
    if (index < 0) return { panier: [...state.panier, { vetement, quantite: 1, prixUnitaire: price }] };
    return { panier: state.panier.map((item, i) => i === index ? { ...item, quantite: item.quantite + 1, prixUnitaire: price } : item) };
  }),
  retirerVetement: (vetementId) => set((state) => ({ panier: state.panier.flatMap((item) => item.vetement.id !== vetementId ? [item] : item.quantite > 1 ? [{ ...item, quantite: item.quantite - 1 }] : []) })),
  setPoids: (poidsKilo) => set({ poidsKilo: Math.max(0, Number.isFinite(poidsKilo) ? poidsKilo : 0) }),
  resetCommande: () => set((state) => ({ ...initial, tarifKilo: state.tarifKilo, forfaitConfigs: state.forfaitConfigs, tarifsPressing: state.tarifsPressing, tarifsBlanchisserie: state.tarifsBlanchisserie })),
  nombrePieces: () => get().panier.reduce((total, item) => total + item.quantite, 0),
  calculerTotal: () => {
    const state = get();
    if (state.serviceActif === 'PRESSING' && state.modeFacturation === 'KILO') return Math.round(state.poidsKilo * state.tarifKilo);
    const pieces = state.panier.reduce((total, item) => total + item.quantite, 0);
    const subtotal = state.panier.reduce((total, item) => total + item.quantite * (item.prixUnitaire ?? 0), 0);
    if (state.serviceActif === 'BLANCHISSERIE' && state.modeFacturation === 'FORFAIT') {
      const config = state.forfaitConfigs[state.prestationBlanchisserie];
      if (pieces < config.nbPiecesRequis) return subtotal;
      let remainingInPackage = config.nbPiecesRequis;
      const extrasTotal = state.panier.reduce((extras, item) => {
        const included = Math.min(remainingInPackage, item.quantite);
        remainingInPackage -= included;
        return extras + (item.quantite - included) * (item.prixUnitaire ?? 0);
      }, 0);
      return config.prixTotal + extrasTotal;
    }
    return subtotal;
  }
}));
