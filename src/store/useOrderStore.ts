import { create } from 'zustand';
import { DEFAULT_FORFAITS, prixUnitaire } from '../data/catalog';
import type { ForfaitConfig, ItemPanier, ModeFacturation, PrestationBlanchisserie, PrestationPressing, ServiceType, TypeVetement } from '../types';

type OrderState = {
  serviceActif: ServiceType;
  modeFacturation: ModeFacturation;
  prestationPressing: PrestationPressing;
  prestationBlanchisserie: PrestationBlanchisserie;
  panier: ItemPanier[];
  poidsKilo: number;
  tarifKilo: number;
  forfaitConfigs: Record<PrestationBlanchisserie, ForfaitConfig>;
  setService: (service: ServiceType) => void;
  setModeFacturation: (mode: ModeFacturation) => void;
  setPrestationPressing: (prestation: PrestationPressing) => void;
  setPrestationBlanchisserie: (prestation: PrestationBlanchisserie) => void;
  setForfaitConfig: (prestation: PrestationBlanchisserie, config: ForfaitConfig) => void;
  ajouterVetement: (vetement: TypeVetement) => void;
  retirerVetement: (vetementId: string) => void;
  setPoids: (poids: number) => void;
  resetCommande: () => void;
  calculerTotal: () => number;
  nombrePieces: () => number;
};

const initial = {
  serviceActif: 'PRESSING' as ServiceType,
  modeFacturation: 'KILO' as ModeFacturation,
  prestationPressing: 'LAVAGE_REPASSAGE' as PrestationPressing,
  prestationBlanchisserie: 'LAVAGE_SIMPLE' as PrestationBlanchisserie,
  panier: [] as ItemPanier[],
  poidsKilo: 0,
  tarifKilo: 1600,
  forfaitConfigs: { ...DEFAULT_FORFAITS }
};

/** Le panier garde toujours le détail des pièces, y compris pour la facturation au kilo. */
export const useOrderStore = create<OrderState>((set, get) => ({
  ...initial,
  setService: (serviceActif) => set((state) => {
    const prestation = serviceActif === 'PRESSING' ? state.prestationPressing : state.prestationBlanchisserie;
    return {
      serviceActif,
      modeFacturation: serviceActif === 'PRESSING' ? 'KILO' : 'UNITE',
      panier: state.panier.map((item) => ({ ...item, prixUnitaire: prixUnitaire(serviceActif, prestation, item.vetement.id) }))
    };
  }),
  setModeFacturation: (modeFacturation) => set({ modeFacturation }),
  setPrestationPressing: (prestationPressing) => set((state) => ({
    prestationPressing,
    panier: state.panier.map((item) => ({ ...item, prixUnitaire: prixUnitaire('PRESSING', prestationPressing, item.vetement.id) }))
  })),
  setPrestationBlanchisserie: (prestationBlanchisserie) => set((state) => ({
    prestationBlanchisserie,
    panier: state.panier.map((item) => ({ ...item, prixUnitaire: prixUnitaire('BLANCHISSERIE', prestationBlanchisserie, item.vetement.id) }))
  })),
  setForfaitConfig: (prestation, config) => set((state) => ({ forfaitConfigs: { ...state.forfaitConfigs, [prestation]: config } })),
  ajouterVetement: (vetement) => set((state) => {
    const index = state.panier.findIndex((item) => item.vetement.id === vetement.id);
    const price = state.serviceActif === 'PRESSING'
      ? prixUnitaire('PRESSING', state.prestationPressing, vetement.id)
      : prixUnitaire('BLANCHISSERIE', state.prestationBlanchisserie, vetement.id);
    if (index < 0) return { panier: [...state.panier, { vetement, quantite: 1, prixUnitaire: price }] };
    return { panier: state.panier.map((item, i) => i === index ? { ...item, quantite: item.quantite + 1, prixUnitaire: price } : item) };
  }),
  retirerVetement: (vetementId) => set((state) => ({
    panier: state.panier.flatMap((item) => item.vetement.id !== vetementId ? [item] : item.quantite > 1 ? [{ ...item, quantite: item.quantite - 1 }] : [])
  })),
  setPoids: (poidsKilo) => set({ poidsKilo: Math.max(0, Number.isFinite(poidsKilo) ? poidsKilo : 0) }),
  resetCommande: () => set((state) => ({ ...initial, forfaitConfigs: state.forfaitConfigs })),
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
