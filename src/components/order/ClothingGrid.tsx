import { useMemo, useState } from 'react';
import { Check, Search, Shirt, Sparkles } from 'lucide-react';
import { useOrderStore } from '../../store/useOrderStore';
import { VETEMENTS } from '../../data/catalog';
import type { CategorieVetement } from '../../types';
import { cn } from '../../lib/utils';
import { ClothingIcon } from './ClothingIcon';

const filters: { id: 'TOUS' | CategorieVetement; label: string }[] = [
  { id: 'TOUS', label: 'Tout' }, { id: 'HAUTS', label: 'Hauts' }, { id: 'BAS', label: 'Bas' },
  { id: 'ROBES', label: 'Robes & boubous' }, { id: 'LITERIE', label: 'Linge de maison' }
];

export default function ClothingGrid() {
  const [category, setCategory] = useState<(typeof filters)[number]['id']>('TOUS');
  const [query, setQuery] = useState('');
  const panier = useOrderStore((state) => state.panier);
  const add = useOrderStore((state) => state.ajouterVetement);
  const isKilo = useOrderStore((state) => state.serviceActif === 'PRESSING' && state.modeFacturation === 'KILO');
  const theme = useOrderStore((state) => state.serviceActif);
  const items = useMemo(() => VETEMENTS.filter((item) => (category === 'TOUS' || item.categorie === category) && item.nom.toLowerCase().includes(query.toLowerCase().trim())), [category, query]);

  const addItem = (item: (typeof VETEMENTS)[number]) => {
    add(item);
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col" aria-label="Sélection des vêtements">
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('grid h-10 w-10 place-items-center rounded-xl', theme === 'PRESSING' ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700')}><Shirt size={20} /></div>
          <div><h2 className="text-lg font-extrabold tracking-tight text-slate-800">Ajouter des pièces</h2><p className="text-xs text-slate-500">Touchez un vêtement pour l’ajouter au panier</p></div>
        </div>
        <label className="flex h-11 w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm xl:max-w-[260px]">
          <Search size={17} className="shrink-0 text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un vêtement" aria-label="Rechercher un vêtement" className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-slate-400 focus:ring-0" />
          {query && <button onClick={() => setQuery('')} aria-label="Effacer la recherche" className="text-xs font-bold text-slate-400">×</button>}
        </label>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none" role="tablist" aria-label="Catégories">
        {filters.map((filter) => <button key={filter.id} type="button" role="tab" aria-selected={category === filter.id} onClick={() => setCategory(filter.id)} className={cn('min-h-10 shrink-0 rounded-full border px-4 text-sm font-bold transition-colors', category === filter.id ? theme === 'PRESSING' ? 'border-blue-600 bg-blue-600 text-white shadow-sm' : 'border-teal-600 bg-teal-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50')}>
          {filter.label}
        </button>)}
      </div>

      {isKilo && <div className="mb-3 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800"><Sparkles size={15} /> Le suivi des pièces est inclus — le montant reste calculé au poids.</div>}

      <div className="grid flex-1 auto-rows-[minmax(126px,1fr)] grid-cols-2 gap-3 overflow-y-auto pb-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {items.map((item) => {
          const quantity = panier.find((line) => line.vetement.id === item.id)?.quantite ?? 0;
          return <button key={item.id} type="button" onClick={() => addItem(item)} aria-label={`Ajouter ${item.nom}${quantity ? `, quantité actuelle ${quantity}` : ''}`} className={cn('card relative flex min-h-[126px] select-none flex-col items-center justify-center gap-2 rounded-2xl border bg-white p-3 text-center shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:scale-95', quantity ? theme === 'PRESSING' ? 'border-blue-300 ring-2 ring-blue-100' : 'border-teal-300 ring-2 ring-teal-100' : 'border-slate-200')}>
            <span className={cn('absolute right-2 top-2 grid h-7 min-w-7 place-items-center rounded-full px-1 text-xs font-black text-white shadow-sm transition-all', quantity ? 'animate-pop scale-100 opacity-100' : 'scale-75 bg-slate-300 opacity-0', theme === 'PRESSING' ? 'bg-blue-600' : 'bg-teal-600')}>{quantity > 0 ? `+${quantity}` : ''}</span>
            <span className={cn('grid h-[60px] w-[68px] place-items-center rounded-2xl', item.categorie === 'LITERIE' ? 'bg-teal-50' : 'bg-blue-50')}><ClothingIcon item={item} className="h-[48px] w-[44px]" /></span>
            <span className="text-sm font-extrabold text-slate-800">{item.nom}</span>
            {quantity > 0 && <span className={cn('absolute bottom-2 left-2 flex items-center gap-1 text-[10px] font-bold', theme === 'PRESSING' ? 'text-blue-600' : 'text-teal-700')}><Check size={12} /> Ajouté</span>}
          </button>;
        })}
        {items.length === 0 && <div className="col-span-full flex min-h-36 flex-col items-center justify-center text-slate-400"><Search size={24} /><p className="mt-2 text-sm">Aucun vêtement trouvé</p></div>}
      </div>
    </section>
  );
}
