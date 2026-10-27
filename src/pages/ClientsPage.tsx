import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Crown, Phone, Search, UserRound, Users } from 'lucide-react';
import { listOrders } from '../lib/orders';
import type { OrderRecord } from '../types';
import { formatFCFA } from '../components/order/CartSidebar';
import { cn } from '../lib/utils';

type ClientSummary = { key: string; name: string; phone: string; orders: number; spend: number; due: number; lastVisit: string };

export default function ClientsPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [query, setQuery] = useState('');
  const reload = useCallback(async () => setOrders(await listOrders()), []);
  useEffect(() => { void reload(); }, [reload]);
  const clients = useMemo(() => {
    const map = new Map<string, ClientSummary>();
    for (const order of orders) {
      const name = order.client_nom?.trim() || 'Client comptoir';
      const phone = order.client_telephone?.trim() || '';
      const key = phone || `${name.toLowerCase()}-${order.id}`;
      const previous = map.get(key) ?? { key, name, phone, orders: 0, spend: 0, due: 0, lastVisit: order.created_at };
      previous.orders += 1;
      previous.spend += order.total_fcfa;
      previous.due += Math.max(0, order.total_fcfa - (order.montant_paye ?? 0));
      if (order.created_at > previous.lastVisit) previous.lastVisit = order.created_at;
      map.set(key, previous);
    }
    return [...map.values()].sort((a, b) => b.lastVisit.localeCompare(a.lastVisit));
  }, [orders]);
  const visible = clients.filter((client) => `${client.name} ${client.phone}`.toLowerCase().includes(query.toLowerCase().trim()));
  const regulars = clients.filter((client) => client.orders >= 5).length;
  const totalDue = clients.reduce((sum, client) => sum + client.due, 0);

  return <div className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
    <div className="mb-6"><p className="mb-1 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[.15em] text-blue-600"><Users size={14} /> Relation client</p><h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Clients</h1><p className="mt-1 text-sm text-slate-500">Retrouvez les fiches et l’historique de vos clients.</p></div>
    <div className="mb-4 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-bold text-slate-500">Fiches clients</p><p className="mt-2 text-2xl font-black text-slate-900">{clients.length}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-bold text-slate-500">Clients réguliers · 5+ dépôts</p><p className="mt-2 flex items-center gap-2 text-2xl font-black text-amber-600"><Crown size={20} />{regulars}</p></div><div className="rounded-2xl border border-amber-100 bg-amber-50 p-4"><p className="text-xs font-bold text-amber-800">Soldes clients à recouvrer</p><p className="mt-2 text-2xl font-black text-amber-900">{formatFCFA(totalDue)}</p></div></div>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center"><div><h2 className="font-extrabold text-slate-900">Carnet clients</h2><p className="mt-1 text-xs text-slate-400">Les profils sont créés à partir des coordonnées saisies lors de la réception.</p></div><label className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 sm:w-[280px]"><Search size={15} className="text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom ou téléphone" className="w-full border-0 text-xs outline-none focus:ring-0" /></label></div>
      {visible.length === 0 ? <div className="p-12 text-center"><div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-slate-50 text-slate-300"><UserRound size={20} /></div><p className="text-sm font-bold text-slate-700">Aucun client à afficher</p><p className="mt-1 text-xs text-slate-400">Ajoutez un nom ou un numéro à la réception pour créer une fiche.</p></div> : <div className="divide-y divide-slate-100">{visible.map((client) => <article key={client.key} className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center"><div className="flex min-w-0 items-center gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-amber-100 text-sm font-black text-amber-800">{client.name.split(' ').slice(0, 2).map((word) => word[0]).join('').toUpperCase()}</div><div className="min-w-0"><p className="truncate text-sm font-extrabold text-slate-800">{client.name}{client.orders >= 5 && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black text-amber-800"><Crown size={10} className="mr-1 inline" />Fidèle</span>}</p><p className="mt-1 flex items-center gap-1 text-xs text-slate-400">{client.phone ? <><Phone size={12} /><a href={`tel:${client.phone}`} className="hover:text-blue-700">{client.phone}</a></> : 'Téléphone non renseigné'}</p></div></div><div className="grid grid-cols-3 gap-4 pl-14 sm:min-w-[420px] sm:pl-0"><div><p className="text-[10px] font-bold text-slate-400">COMMANDES</p><p className="mt-1 text-xs font-extrabold text-slate-700">{client.orders} dépôt{client.orders !== 1 ? 's' : ''}</p></div><div><p className="text-[10px] font-bold text-slate-400">TOTAL FACTURÉ</p><p className="mt-1 text-xs font-extrabold text-slate-700">{formatFCFA(client.spend)}</p></div><div><p className="text-[10px] font-bold text-slate-400">SOLDE DÛ</p><p className={cn('mt-1 text-xs font-extrabold', client.due ? 'text-amber-700' : 'text-emerald-700')}>{formatFCFA(client.due)}</p></div></div><span className="hidden items-center gap-1 text-[10px] font-bold text-slate-400 xl:flex">Dernière visite {new Date(client.lastVisit).toLocaleDateString('fr-FR')} <ArrowUpRight size={12} /></span></article>)}</div>}
    </section>
  </div>;
}
