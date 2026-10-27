# Comptoir Pressing & Blanchisserie

MVP PWA tactile pour la réception, l'encaissement et le suivi de commandes au comptoir, pensé pour les tablettes en mode paysage et les usages hors connexion.

## Démarrage

```bash
npm install
npm run dev
```

La version de production se vérifie avec `npm run build`. La PWA précache l'application pour permettre son ouverture hors ligne. Les commandes hors ligne sont conservées dans le stockage local du navigateur, puis synchronisées quand la connexion revient.

## Fonctionnalités

- **Comptoir** : pressing au kilo avec suivi des pièces, pressing à l'unité et blanchisserie avec forfaits.
- **Encaissement** : fiche client facultative, espèces/mobile money, acompte ou paiement complet, solde dû visible.
- **Suivi** : commandes reçues, en traitement, prêtes et retirées ; recherche par numéro de ticket, client ou téléphone.
- **Historique et activité** : liste filtrable, état des paiements, chiffre d'affaires et vue des 7 derniers jours.
- **Paramètres** : tarif au kilo, tarifs unitaires par vêtement/prestation et règles forfaitaires modifiables. Les paramètres sont persistés localement sur la tablette.
- **Hors connexion** : tickets et changements d'état mis en file et synchronisés au retour du réseau.

## Supabase (facultatif en développement)

Copiez `.env.example` vers `.env.local`, puis renseignez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`. Sans configuration Supabase, ou si l'API est indisponible, les tickets sont conservés sur l'appareil.

Schéma minimal utilisé par l'application :

```sql
create table public.orders (
  id text primary key,
  created_at timestamptz not null,
  service text not null,
  prestation text not null,
  mode text not null,
  poids_kg numeric,
  items jsonb not null,
  total_fcfa integer not null,
  sync_status text not null default 'synced',
  client_nom text,
  client_telephone text,
  montant_paye integer not null default 0,
  moyen_paiement text not null default 'NON_PAYE',
  statut text not null default 'RECU'
);
```

Si vous avez déjà créé la table avec la première version du MVP, ajoutez les colonnes de la phase 2 :

```sql
alter table public.orders
  add column if not exists client_nom text,
  add column if not exists client_telephone text,
  add column if not exists montant_paye integer not null default 0,
  add column if not exists moyen_paiement text not null default 'NON_PAYE',
  add column if not exists statut text not null default 'RECU';
```

Pour un essai uniquement, configurez les politiques RLS pour autoriser lecture, insertion et mise à jour des tickets depuis l'application. **Ne laissez pas de politique publique ouverte en production** : ajoutez l'authentification du personnel et des règles d'accès adaptées avant d'y conserver des données clients. Les paramètres tarifaires sont pour l'instant propres à chaque tablette ; leur synchronisation entre appareils est une évolution ultérieure.

## Tarifs d'exemple

Les tarifs par vêtement et forfaits initiaux sont dans `src/data/catalog.ts`. Les prix sont des exemples à remplacer par ceux de l'établissement.
