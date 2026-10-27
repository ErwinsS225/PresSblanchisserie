import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, Check, Clock3, Droplets, PackageCheck, Search, Shirt, Sparkles } from 'lucide-react';
import { listOrders, setOrderStatus } from '../lib/orders';
import type { OrderRecord, OrderStatus } from '../types';
import { cn } from '../lib/utils';
import { formatFCFA } from '../components/order/CartSidebar';

const lanes: { id: OrderStatus; label: string; hint: string; className: string; badge: string }[] = [
  { id: 'RECU', label: 'Réceptionnés', hint: 'À prendre en charge', className: 'bg-zinc-200 text-zinc-800', badge: 'bg-zinc-800 text-white' },
  { id: 'LAVAGE', label: 'Lavage', hint: 'En cours de traitement', className: 'bg-blue-100 text-blue-800', badge: 'bg-blue-600 text-white' },
  { id: 'FINITION', label: 'Repassage / Finition', hint: 'Contrôle qualité', className: 'bg-amber-100 text-amber-800', badge: 'bg-amber-500 text-white' },
  { id: 'PRETE', label: 'Prêtes à remettre', hint: 'Comptoir de retrait', className: 'bg-violet-600 text-white', badge: 'bg-white text-violet-700' }
];
const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = { RECU: 'LAVAGE', LAVAGE: 'FINITION', FINITION: 'PRETE', PRETE: 'RETIRÉE' };
const moveLabel: Partial<Record<OrderStatus, string>> = { RECU: 'Démarrer le lavage', LAVAGE: 'Lavage terminé', FINITION: 'Marquer prête', PRETE: 'Remettre au client' };

export default function ProductionPage({ onOpenCash }: { onOpenCash: () => void }) {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => { setOrders(await listOrders()); setLoading(false); }, []);
  useEffect(() => { void reload(); }, [reload]);
  const activeOrders = useMemo(() => orders.filter((order) => (order.statut ?? 'RECU') !== 'RETIRÉE' && `${order.id} ${order.client_nom ?? ''} ${order.client_telephone ?? ''}`.toLowerCase().includes(query.toLowerCase().trim())), [orders, query]);

  const moveOrder = async (order: OrderRecord, status: OrderStatus) => { await setOrderStatus(order.id, status); await reload(); };
  const late = (order: OrderRecord) => Boolean(order.retrait_prevu && new Date(order.retrait_prevu).getTime() < Date.now() && (order.statut ?? 'RECU') !== 'PRETE');

  return <div className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
    <div className="mb-4 flex flex-col justify-between gap-3 xl:flex-row xl:items-center"><div><p className="mb-1 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[.15em] text-blue-600"><Droplets size={14} /> Atelier & comptoir</p><h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-[28px]">Production & remises</h1><p className="mt-1 text-sm text-slate-500">Faites avancer les tickets du dépôt jusqu’au retrait.</p></div><label className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm xl:w-[300px]"><Search size={16} className="text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ticket, client ou téléphone" className="w-full border-0 bg-transparent text-xs outline-none focus:ring-0" /></label></div>

    <div className="grid gap-3 xl:grid-cols-4">{lanes.map((lane) => {
      const laneOrders = activeOrders.filter((order) => (order.statut ?? 'RECU') === lane.id);
      return <section key={lane.id} className="min-w-0 rounded-xl border border-slate-200 bg-slate-100/70 p-2.5 sm:p-3"><div className={cn('mb-2 flex items-center justify-between rounded-lg px-3 py-2.5', lane.className)}><div><h2 className="text-xs font-black uppercase tracking-wide">{lane.label}</h2><p className={cn('mt-0.5 text-[10px]', lane.id === 'PRETE' ? 'text-violet-100' : 'opacity-70')}>{lane.hint}</p></div><span className={cn('grid h-7 min-w-7 place-items-center rounded-full px-2 text-xs font-black', lane.badge)}>{laneOrders.length}</span></div>
        <div className="space-y-2">{laneOrders.map((order) => {
          const isLate = late(order);
          const pieces = order.items.reduce((sum, item) => sum + item.quantite, 0);
          const remaining = Math.max(0, order.total_fcfa - (order.montant_paye ?? 0));
          return <article key={order.id} className={cn('rounded-xl border border-slate-200 bg-white p-3 shadow-sm', isLate && 'border-l-4 border-l-rose-500')}>
            <div className="mb-2 flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-xs font-black text-slate-900">{order.id} · {order.client_nom || 'Client comptoir'}</p><p className="mt-0.5 truncate text-[10px] text-slate-400">{order.client_telephone || 'Sans téléphone'}</p></div>{isLate ? <span className="rounded-full bg-rose-100 px-2 py-1 text-[9px] font-extrabold text-rose-700"><AlertTriangle size={10} className="mr-1 inline" />Retard</span> : order.express ? <span className="rounded-full bg-amber-100 px-2 py-1 text-[9px] font-extrabold text-amber-800">Express</span> : null}</div>
            <div className="mb-2 rounded-lg bg-slate-50 p-2"><p className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">{order.service === 'PRESSING' ? <Shirt size={12} /> : <Sparkles size={12} />}{order.mode === 'KILO' ? `${order.poids_kg ?? 0} kg · ${pieces} article(s)` : `${pieces} article(s)`}</p><p className="mt-1 text-[10px] leading-relaxed text-slate-500">{order.items.slice(0, 3).map((item) => `${item.quantite} ${item.vetement.nom.toLowerCase()}`).join(' · ')}{order.items.length > 3 ? '…' : ''}</p></div>
            <div className="flex items-center justify-between gap-1 text-[10px]"><span className="flex items-center gap-1 text-slate-400"><Clock3 size={11} />{order.retrait_prevu ? new Date(order.retrait_prevu).toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Retrait à définir'}</span><span className="font-extrabold text-slate-800">{formatFCFA(order.total_fcfa)}</span></div>
            {order.consignes && <p className="mt-2 line-clamp-2 rounded-md bg-amber-50 px-2 py-1.5 text-[10px] text-amber-800">Consigne : {order.consignes}</p>}
            {lane.id === 'PRETE' && remaining > 0 ? <button type="button" onClick={onOpenCash} className="mt-2 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-violet-600 text-[10px] font-extrabold text-white hover:bg-violet-700"><span>Encaisser {formatFCFA(remaining)}</span><ArrowRight size={13} /></button> : <button type="button" onClick={() => lane.id === 'PRETE' ? void moveOrder(order, 'RETIRÉE') : nextStatus[lane.id] && void moveOrder(order, nextStatus[lane.id]!)} className={cn('mt-2 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg text-[10px] font-extrabold transition', lane.id === 'PRETE' ? 'border border-violet-200 text-violet-700 hover:bg-violet-50' : 'bg-slate-900 text-white hover:bg-blue-700')}>
              {lane.id === 'PRETE' ? <Check size={13} /> : <ArrowRight size={13} />}{moveLabel[lane.id]}
            </button>}
          </article>;
        })}{laneOrders.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 px-3 py-8 text-center text-[11px] text-slate-400">{loading ? 'Chargement…' : 'Aucun ticket dans cette étape'}</div>}</div>
      </section>;
    })}</div>
    <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs"><span className="font-bold text-slate-500">{activeOrders.length} tickets dans l’atelier</span><span className="flex items-center gap-1.5 text-slate-400"><PackageCheck size={14} /> Mise à jour locale et cloud</span></div>
  </div>;
}
