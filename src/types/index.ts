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
};
