import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, CircleDollarSign, Clock3, PackageCheck, Search, Shirt, Sparkles } from 'lucide-react';
import { BLANCHISSERIE_SERVICES, PRESSING_SERVICES } from '../data/catalog';
import { listOrders, pendingOrderCount, setOrderStatus } from '../lib/orders';
import type { OrderRecord, OrderStatus } from '../types';
import { cn } from '../lib/utils';
import { formatFCFA } from '../components/order/CartSidebar';

const statuses: { id: OrderStatus | 'TOUTES'; label: string }[] = [
  { id: 'TOUTES', label: 'Toutes' }, { id: 'RECU', label: 'Reçues' }, { id: 'EN_TRAITEMENT', label: 'En traitement' }, { id: 'PRETE', label: 'Prêtes' }, { id: 'RETIRÉE', label: 'Retirées' }
];
const statusLabel: Record<OrderStatus, string> = { RECU: 'Reçue', EN_TRAITEMENT: 'En traitement', PRETE: 'Prête', RETIRÉE: 'Retirée' };
const statusStyle: Record<OrderStatus, string> = { RECU: 'bg-blue-50 text-blue-700', EN_TRAITEMENT: 'bg-amber-50 text-amber-800', PRETE: 'bg-emerald-50 text-emerald-700', RETIRÉE: 'bg-slate-100 text-slate-600' };
const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = { RECU: 'EN_TRAITEMENT', EN_TRAITEMENT: 'PRETE', PRETE: 'RETIRÉE' };

export default function OrdersPage({ online }: { online: boolean }) {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<OrderStatus | 'TOUTES'>('TOUTES');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => { setLoading(true); setOrders(await listOrders()); setLoading(false); }, []);
  useEffect(() => { void reload(); }, [reload]);

  const visible = useMemo(() => orders.filter((order) => {
    const haystack = `${order.id} ${order.client_nom ?? ''} ${order.client_telephone ?? ''}`.toLowerCase();
    return (filter === 'TOUTES' || (order.statut ?? 'RECU') === filter) && haystack.includes(query.toLowerCase().trim());
  }), [orders, filter, query]);
  const changeStatus = async (order: OrderRecord) => {
    const next = nextStatus[order.statut ?? 'RECU'];
    if (!next) return;
    await setOrderStatus(order.id, next);
    await reload();
  };

  return <div className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-1 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[.15em] text-blue-600"><PackageCheck size={14} /> Suivi en temps réel</p><h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Commandes</h1><p className="mt-1 text-sm text-slate-500">Suivez chaque ticket de la réception au retrait.</p></div><div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-500 shadow-sm"><span className={cn('h-2 w-2 rounded-full', online ? 'bg-emerald-500' : 'bg-amber-500')} />{online ? 'Synchronisation active' : `${pendingOrderCount()} à synchroniser hors ligne`}</div></div>

    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="flex gap-2 overflow-x-auto pb-1">{statuses.map((status) => <button key={status.id} onClick={() => setFilter(status.id)} className={cn('h-10 shrink-0 rounded-xl px-4 text-xs font-extrabold transition', filter === status.id ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50')}>{status.label}{status.id === 'TOUTES' ? ` · ${orders.length}` : ` · ${orders.filter((item) => (item.statut ?? 'RECU') === status.id).length}`}</button>)}</div>
      <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm lg:w-[330px]"><Search size={17} className="text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="N° commande, client ou téléphone" className="w-full border-0 bg-transparent text-sm outline-none focus:ring-0" /></label>
    </div>

    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="hidden grid-cols-[1.25fr_1fr_1fr_1fr_auto] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 md:grid"><span>Ticket / client</span><span>Service</span><span>Commande</span><span>Montant</span><span>État</span></div>
      {loading ? <div className="p-10 text-center text-sm text-slate-400">Chargement de l’historique…</div> : visible.length === 0 ? <div className="p-12 text-center"><div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 text-slate-300"><Search size={22} /></div><p className="font-bold text-slate-700">Aucune commande trouvée</p><p className="mt-1 text-xs text-slate-400">Les commandes enregistrées apparaîtront ici.</p></div> : <div className="divide-y divide-slate-100">
        {visible.map((order) => {
          const status = order.statut ?? 'RECU';
          const unpaid = Math.max(0, order.total_fcfa - (order.montant_paye ?? 0));
          const serviceNames = order.service === 'PRESSING' ? PRESSING_SERVICES : BLANCHISSERIE_SERVICES;
          const serviceName = serviceNames.find((item) => item.id === order.prestation)?.label ?? order.prestation;
          const expandedOrder = expanded === order.id;
          return <article key={order.id} className="px-4 py-4 sm:px-5">
            <div className="grid gap-3 md:grid-cols-[1.25fr_1fr_1fr_1fr_auto] md:items-center md:gap-4">
              <button type="button" onClick={() => setExpanded(expandedOrder ? null : order.id)} className="flex min-w-0 items-center gap-3 text-left"><div className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', order.service === 'PRESSING' ? 'bg-blue-50 text-blue-700' : 'bg-teal-50 text-teal-700')}>{order.service === 'PRESSING' ? <Shirt size={18} /> : <Sparkles size={18} />}</div><span className="min-w-0"><span className="block truncate text-sm font-black text-slate-800">{order.client_nom || 'Client comptoir'}</span><span className="block truncate text-[11px] font-medium text-slate-400">{order.id} · {new Date(order.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</span></span></button>
              <div className="pl-[52px] md:pl-0"><span className="block text-xs font-bold text-slate-700">{order.service === 'PRESSING' ? 'Pressing' : 'Blanchisserie'}</span><span className="block text-[11px] text-slate-400">{serviceName}</span></div>
              <div className="pl-[52px] md:pl-0"><span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold', statusStyle[status])}><span className="h-1.5 w-1.5 rounded-full bg-current" />{statusLabel[status]}</span></div>
              <div className="flex items-center justify-between pl-[52px] md:block md:pl-0"><span><span className="block text-sm font-black text-slate-800">{formatFCFA(order.total_fcfa)}</span><span className={cn('block text-[10px] font-bold', unpaid ? 'text-amber-700' : 'text-emerald-700')}>{unpaid ? `Reste ${formatFCFA(unpaid)}` : 'Payée'}</span></span><span className="text-[11px] text-slate-400 md:hidden">{order.client_telephone}</span></div>
              <div className="flex items-center justify-between gap-2 pl-[52px] md:pl-0"><span className="text-xs text-slate-500 md:hidden">{order.client_telephone || '—'}</span><button type="button" disabled={!nextStatus[status]} onClick={() => void changeStatus(order)} className="flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-[11px] font-extrabold text-white transition hover:bg-blue-700 disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-400">{status === 'RECU' ? 'Démarrer' : status === 'EN_TRAITEMENT' ? 'Marquer prête' : status === 'PRETE' ? 'Marquer retirée' : 'Terminé'}{nextStatus[status] && <ChevronDown size={14} />}</button></div>
            </div>
            {expandedOrder && <div className="mt-4 rounded-xl bg-slate-50 p-4 animate-slide-in"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-extrabold text-slate-800">Détail du ticket</p><p className="mt-1 text-[11px] text-slate-500">{order.client_telephone || 'Aucun numéro'} · {order.mode === 'KILO' ? `${order.poids_kg ?? 0} kg` : `${order.items.reduce((sum, item) => sum + item.quantite, 0)} pièces`}</p></div><div className="flex items-center gap-1.5 text-xs font-bold text-slate-600"><CircleDollarSign size={15} />{order.moyen_paiement === 'MOBILE_MONEY' ? 'Mobile money' : order.moyen_paiement === 'ESPECES' ? 'Espèces' : 'À encaisser'}</div></div><div className="flex flex-wrap gap-2">{order.items.map((item) => <span key={item.vetement.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700">{item.quantite} × {item.vetement.nom}</span>)}{order.items.length === 0 && <span className="text-xs text-slate-400">Aucune pièce détaillée</span>}</div><div className="mt-3 flex items-center gap-1 text-[11px] text-slate-400"><Clock3 size={13} /> Créée le {new Date(order.created_at).toLocaleString('fr-FR')}</div></div>}
          </article>;
        })}
      </div>}
      {!loading && visible.length > 0 && <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-5 py-3 text-[11px] font-medium text-slate-400"><span>{visible.length} commande{visible.length > 1 ? 's' : ''}</span><span className="flex items-center gap-1"><Check size={13} /> Mise à jour locale et cloud</span></div>}
    </div>
  </div>;
}
