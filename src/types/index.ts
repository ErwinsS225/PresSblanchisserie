export type ServiceType = 'PRESSING' | 'BLANCHISSERIE';
export type PrestationPressing = 'LAVAGE_REPASSAGE' | 'NETTOYAGE_SEC' | 'AMIDONNAGE' | 'DETACHAGE' | 'GESTION_TACHES';
export type PrestationBlanchisserie = 'LAVAGE_SIMPLE' | 'LAVAGE_REPASSAGE' | 'REPASSAGE';
export type ModeFacturation = 'KILO' | 'UNITE' | 'FORFAIT';
export type CategorieVetement = 'HAUTS' | 'BAS' | 'ROBES' | 'LITERIE' | 'AUTRE';

export type TypeVetement = {
  id: string;
  nom: string;
  icone: string;
  categorie: CategorieVetement;
};

export type ItemPanier = {
  vetement: TypeVetement;
  quantite: number;
  /** Prix unitaire mémorisé pour la prestation courante (absent au kilo). */
  prixUnitaire?: number;
};

export type ForfaitConfig = {
  nbPiecesRequis: number;
  prixTotal: number;
};

export type OrderStatus = 'RECU' | 'LAVAGE' | 'FINITION' | 'PRETE' | 'RETIRÉE';
export type PaymentMethod = 'ESPECES' | 'WAVE' | 'MTN_MONEY' | 'ORANGE_MONEY' | 'NON_PAYE';
export type PaymentEntry = { id: string; created_at: string; amount_fcfa: number; method: Exclude<PaymentMethod, 'NON_PAYE'> };

export type OrderRecord = {
  id: string;
  created_at: string;
  service: ServiceType;
  prestation: string;
  mode: ModeFacturation;
  poids_kg: number | null;
  items: ItemPanier[];
  total_fcfa: number;
  sync_status: 'synced' | 'pending';
  client_nom?: string;
  client_telephone?: string;
  montant_paye?: number;
  moyen_paiement?: PaymentMethod;
  paiements?: PaymentEntry[];
  statut?: OrderStatus;
  retrait_prevu?: string;
  express?: boolean;
  consignes?: string;
};

export type CheckoutDetails = {
  client_nom: string;
  client_telephone: string;
  montant_paye: number;
  moyen_paiement: PaymentMethod;
  retrait_prevu: string;
  express: boolean;
  consignes: string;
};
