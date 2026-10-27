import { useCallback, useEffect, useMemo, useState } from 'react';
import { Banknote, ClipboardList, Clock3, PackageCheck, TrendingUp } from 'lucide-react';
import { listOrders } from '../lib/orders';
import type { OrderRecord, OrderStatus } from '../types';
import { cn } from '../lib/utils';
import { formatFCFA } from '../components/order/CartSidebar';

const statusInfo: Record<OrderStatus, { label: string; color: string }> = {
  RECU: { label: 'Reçues', color: 'bg-blue-500' }, EN_TRAITEMENT: { label: 'En traitement', color: 'bg-amber-500' }, PRETE: { label: 'Prêtes', color: 'bg-emerald-500' }, RETIRÉE: { label: 'Retirées', color: 'bg-slate-400' }
};

export default function DashboardPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const reload = useCallback(async () => setOrders(await listOrders()), []);
  useEffect(() => { void reload(); }, [reload]);
  const today = new Date().toLocaleDateString('fr-CA');
  const todayOrders = orders.filter((order) => new Date(order.created_at).toLocaleDateString('fr-CA') === today);
  const collectedToday = todayOrders.reduce((sum, order) => sum + (order.montant_paye ?? 0), 0);
  const dueToday = todayOrders.reduce((sum, order) => sum + Math.max(0, order.total_fcfa - (order.montant_paye ?? 0)), 0);
  const inProgress = orders.filter((order) => ['RECU', 'EN_TRAITEMENT'].includes(order.statut ?? 'RECU')).length;
  const ready = orders.filter((order) => order.statut === 'PRETE').length;
  const lastSevenDays = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date(); date.setDate(date.getDate() - (6 - index));
    const key = date.toLocaleDateString('fr-CA');
    const dayOrders = orders.filter((order) => new Date(order.created_at).toLocaleDateString('fr-CA') === key);
    return { label: date.toLocaleDateString('fr-FR', { weekday: 'short' }), total: dayOrders.reduce((sum, order) => sum + order.total_fcfa, 0), count: dayOrders.length };
  }), [orders]);
  const maxTotal = Math.max(1, ...lastSevenDays.map((day) => day.total));
  const cards = [
    { label: 'Commandes aujourd’hui', value: todayOrders.length.toString(), detail: 'Tickets créés ce jour', icon: ClipboardList, color: 'text-blue-700 bg-blue-50' },
    { label: 'Encaissé aujourd’hui', value: formatFCFA(collectedToday), detail: dueToday > 0 ? `${formatFCFA(dueToday)} restent à encaisser` : 'Tous les paiements soldés', icon: Banknote, color: 'text-emerald-700 bg-emerald-50' },
    { label: 'À traiter', value: inProgress.toString(), detail: `${ready} commande${ready !== 1 ? 's' : ''} prête${ready !== 1 ? 's' : ''} au retrait`, icon: Clock3, color: 'text-amber-700 bg-amber-50' },
    { label: 'Chiffre d’affaires du jour', value: formatFCFA(todayOrders.reduce((sum, order) => sum + order.total_fcfa, 0)), detail: 'Montant total facturé aujourd’hui', icon: TrendingUp, color: 'text-violet-700 bg-violet-50' }
  ];

  return <div className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
    <div className="mb-6"><p className="mb-1 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[.15em] text-blue-600"><TrendingUp size={14} /> Vue d’ensemble</p><h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Tableau de bord</h1><p className="mt-1 text-sm text-slate-500">L’activité du comptoir en un coup d’œil.</p></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, detail, icon: Icon, color }) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="mb-4 flex items-center justify-between"><p className="text-xs font-extrabold text-slate-500">{label}</p><div className={cn('grid h-10 w-10 place-items-center rounded-xl', color)}><Icon size={19} /></div></div><p className="text-2xl font-black tracking-tight text-slate-900">{value}</p><p className="mt-1 text-[11px] font-medium text-slate-400">{detail}</p></article>)}</div>

    <div className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_1fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-extrabold text-slate-900">Activité sur 7 jours</h2><p className="mt-1 text-xs text-slate-400">Montant des commandes par jour</p></div><div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-700"><TrendingUp size={17} /></div></div><div className="flex h-48 items-end gap-3 border-b border-slate-100 pb-2 sm:gap-5">{lastSevenDays.map((day, index) => <div key={`${day.label}-${index}`} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><span className="text-[9px] font-bold text-slate-400 sm:text-[10px]">{day.total ? `${Math.round(day.total / 1000)}k` : ''}</span><div className="flex h-[78%] w-full items-end"><div className={cn('w-full rounded-t-lg transition-all', index === 6 ? 'bg-blue-600' : 'bg-blue-200')} style={{ height: `${day.total ? Math.max(8, (day.total / maxTotal) * 100) : 4}%` }} /></div><span className="text-[10px] font-bold capitalize text-slate-400">{day.label}</span></div>)}</div><div className="mt-3 flex items-center justify-between text-[11px] text-slate-400"><span>{lastSevenDays.reduce((sum, day) => sum + day.count, 0)} commandes sur la période</span><span className="font-extrabold text-slate-600">{formatFCFA(lastSevenDays.reduce((sum, day) => sum + day.total, 0))}</span></div></section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-extrabold text-slate-900">État des commandes</h2><p className="mt-1 text-xs text-slate-400">Toutes les commandes enregistrées</p></div><PackageCheck size={19} className="text-slate-400" /></div><div className="space-y-4">{(Object.keys(statusInfo) as OrderStatus[]).map((status) => { const count = orders.filter((order) => (order.statut ?? 'RECU') === status).length; const width = orders.length ? Math.max(count ? 5 : 0, count / orders.length * 100) : 0; return <div key={status}><div className="mb-1.5 flex justify-between text-xs"><span className="font-bold text-slate-600">{statusInfo[status].label}</span><span className="font-extrabold text-slate-800">{count}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={cn('h-full rounded-full transition-all', statusInfo[status].color)} style={{ width: `${width}%` }} /></div></div>; })}</div><div className="mt-5 rounded-xl bg-slate-50 p-3 text-xs font-medium text-slate-500">Total de <b className="text-slate-800">{orders.length}</b> commande{orders.length !== 1 ? 's' : ''} dans l’historique local.</div></section>
    </div>
  </div>;
}
