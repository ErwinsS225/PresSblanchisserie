# Comptoir Pressing & Blanchisserie

MVP PWA tactile pour l'enregistrement des commandes au comptoir, pensé pour les tablettes en mode paysage et les usages hors connexion.

## Démarrage

```bash
npm install
npm run dev
```

La version de production se vérifie avec `npm run build`. La PWA Vite précache l'application pour permettre son ouverture hors ligne. Les commandes hors ligne sont conservées dans le stockage local du navigateur, puis synchronisées quand la connexion revient.

## Supabase (facultatif en développement)

Copiez `.env.example` vers `.env.local`, puis renseignez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`. Sans configuration Supabase, ou si l'API est indisponible, les tickets sont enregistrés dans la file locale de l'appareil.

La table minimale utilisée par ce MVP :

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
  sync_status text not null default 'synced'
);
```

Pour un essai uniquement, configurez les politiques RLS pour autoriser l'insertion et la mise à jour des tickets depuis l'application. **Ne laissez pas une politique publique ouverte en production** : ajoutez l'authentification du personnel et des règles d'accès adaptées avant d'y conserver des données clients.

## Règles de tarification du MVP

- Pressing au kilo : 1 600 FCFA/kg, tout en gardant les pièces du panier pour le suivi.
- Pressing à l'unité : tarifs de démonstration par prestation et vêtement dans `src/data/catalog.ts`.
- Blanchisserie : tarifs unitaires de démonstration et forfaits (20 pièces) dans `src/data/catalog.ts`.
- Les prix sont des exemples à remplacer par ceux de l'établissement.
