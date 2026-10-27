import type { ForfaitConfig, PrestationBlanchisserie, PrestationPressing, TypeVetement } from '../types';

export const VETEMENTS: TypeVetement[] = [
  { id: 'chemise', nom: 'Chemise', icone: 'shirt', categorie: 'HAUTS' },
  { id: 'polo', nom: 'Polo', icone: 'polo', categorie: 'HAUTS' },
  { id: 'tee-shirt', nom: 'T-shirt', icone: 'tee', categorie: 'HAUTS' },
  { id: 'veste', nom: 'Veste', icone: 'jacket', categorie: 'HAUTS' },
  { id: 'pantalon', nom: 'Pantalon', icone: 'trousers', categorie: 'BAS' },
  { id: 'jean', nom: 'Jean', icone: 'jeans', categorie: 'BAS' },
  { id: 'jupe', nom: 'Jupe', icone: 'skirt', categorie: 'BAS' },
  { id: 'robe', nom: 'Robe', icone: 'dress', categorie: 'ROBES' },
  { id: 'boubou', nom: 'Boubou', icone: 'boubou', categorie: 'ROBES' },
  { id: 'drap', nom: 'Drap', icone: 'sheet', categorie: 'LITERIE' },
  { id: 'serviette', nom: 'Serviette', icone: 'towel', categorie: 'LITERIE' },
  { id: 'rideau', nom: 'Rideau', icone: 'curtain', categorie: 'LITERIE' }
];

export const PRESSING_SERVICES: { id: PrestationPressing; label: string; short: string }[] = [
  { id: 'LAVAGE_REPASSAGE', label: 'Lavage + repassage', short: 'Lavage & repassage' },
  { id: 'NETTOYAGE_SEC', label: 'Nettoyage à sec', short: 'Nettoyage à sec' },
  { id: 'AMIDONNAGE', label: 'Amidonnage', short: 'Amidonnage' },
  { id: 'DETACHAGE', label: 'Détachage', short: 'Détachage' },
  { id: 'GESTION_TACHES', label: 'Gestion des tâches', short: 'Traitement taches' }
];

export const BLANCHISSERIE_SERVICES: { id: PrestationBlanchisserie; label: string; short: string }[] = [
  { id: 'LAVAGE_SIMPLE', label: 'Lavage simple', short: 'Lavage simple' },
  { id: 'LAVAGE_REPASSAGE', label: 'Lavage & repassage', short: 'Lavage & repassage' },
  { id: 'REPASSAGE', label: 'Repassage', short: 'Repassage seul' }
];

export const DEFAULT_FORFAITS: Record<PrestationBlanchisserie, ForfaitConfig> = {
  LAVAGE_SIMPLE: { nbPiecesRequis: 20, prixTotal: 2000 },
  LAVAGE_REPASSAGE: { nbPiecesRequis: 20, prixTotal: 3000 },
  REPASSAGE: { nbPiecesRequis: 20, prixTotal: 2500 }
};

// Prix de démonstration en FCFA, personnalisables depuis les paramètres à venir.
export const PRESSING_PRICES: Record<PrestationPressing, Record<string, number>> = {
  LAVAGE_REPASSAGE: { chemise: 700, polo: 600, 'tee-shirt': 500, veste: 1800, pantalon: 900, jean: 900, jupe: 800, robe: 1500, boubou: 1800, drap: 1000, serviette: 500, rideau: 2500 },
  NETTOYAGE_SEC: { chemise: 1200, polo: 1000, 'tee-shirt': 900, veste: 3000, pantalon: 1600, jean: 1600, jupe: 1400, robe: 2800, boubou: 3200, drap: 2000, serviette: 1000, rideau: 4000 },
  AMIDONNAGE: { chemise: 500, polo: 400, 'tee-shirt': 350, veste: 800, pantalon: 500, jean: 500, jupe: 500, robe: 900, boubou: 1200, drap: 800, serviette: 300, rideau: 1200 },
  DETACHAGE: { chemise: 500, polo: 500, 'tee-shirt': 500, veste: 1000, pantalon: 700, jean: 700, jupe: 700, robe: 1000, boubou: 1200, drap: 800, serviette: 500, rideau: 1500 },
  GESTION_TACHES: { chemise: 700, polo: 600, 'tee-shirt': 600, veste: 1200, pantalon: 900, jean: 900, jupe: 800, robe: 1400, boubou: 1500, drap: 1000, serviette: 600, rideau: 1800 }
};
export const BLANCHISSERIE_PRICES: Record<PrestationBlanchisserie, Record<string, number>> = {
  LAVAGE_SIMPLE: { chemise: 250, polo: 250, 'tee-shirt': 200, veste: 700, pantalon: 350, jean: 350, jupe: 300, robe: 500, boubou: 700, drap: 500, serviette: 200, rideau: 1000 },
  LAVAGE_REPASSAGE: { chemise: 400, polo: 350, 'tee-shirt': 300, veste: 1000, pantalon: 500, jean: 500, jupe: 450, robe: 800, boubou: 1000, drap: 700, serviette: 300, rideau: 1500 },
  REPASSAGE: { chemise: 300, polo: 250, 'tee-shirt': 200, veste: 700, pantalon: 400, jean: 400, jupe: 350, robe: 650, boubou: 800, drap: 500, serviette: 250, rideau: 1200 }
};

export const prixUnitaire = (service: 'PRESSING' | 'BLANCHISSERIE', prestation: string, vetementId: string): number => {
  if (service === 'PRESSING') return (PRESSING_PRICES as Record<string, Record<string, number>>)[prestation]?.[vetementId] ?? 500;
  return (BLANCHISSERIE_PRICES as Record<string, Record<string, number>>)[prestation]?.[vetementId] ?? 250;
};
