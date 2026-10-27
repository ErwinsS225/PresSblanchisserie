import { useCallback, useEffect, useMemo, useState } from 'react';
import { Banknote, Check, CircleDollarSign, LockKeyhole, ReceiptText, Search, Smartphone, Wallet } from 'lucide-react';
import { listOrders, recordPayment } from '../lib/orders';
import type { OrderRecord, PaymentEntry, PaymentMethod } from '../types';
import { cn } from '../lib/utils';
import { formatFCFA } from '../components/order/CartSidebar';

const methods: { id: Exclude<PaymentMethod, 'NON_PAYE'>; label: string }[] = [
  { id: 'ESPECES', label: 'Espèces' }, { id: 'WAVE', label: 'Wave' }, { id: 'MTN_MONEY', label: 'MTN MoMo' }, { id: 'ORANGE_MONEY', label: 'Orange Money' }
];
const methodName: Record<PaymentEntry['method'], string> = { ESPECES: 'Espèces', WAVE: 'Wave', MTN_MONEY: 'MTN MoMo', ORANGE_MONEY: 'Orange Money' };
const todayKey = () => new Date().toLocaleDateString('fr-CA');

export default function CashPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [query, setQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<Record<string, Exclude<PaymentMethod, 'NON_PAYE'>>>({});
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [openingFund, setOpeningFund] = useState(20000);
  const [closed, setClosed] = useState(localStorage.getItem(`pressblanchisserie:close:${todayKey()}`) === '1');
  const reload = useCallback(async () => { setOrders(await listOrders()); setLoading(false); }, []);
  useEffect(() => { void reload(); }, [reload]);

  const todayPayments = useMemo(() => orders.flatMap((order) => order.paiements ?? []).filter((payment) => new Date(payment.created_at).toLocaleDateString('fr-CA') === todayKey()), [orders]);
  const receivedByMethod = (method: PaymentEntry['method']) => todayPayments.filter((payment) => payment.method === method).reduce((sum, payment) => sum + payment.amount_fcfa, 0);
  const receivedTotal = todayPayments.reduce((sum, payment) => sum + payment.amount_fcfa, 0);
  const outstanding = useMemo(() => orders.filter((order) => (order.montant_paye ?? 0) < order.total_fcfa && order.statut !== 'RETIRÉE' && `${order.id} ${order.client_nom ?? ''} ${order.client_telephone ?? ''}`.toLowerCase().includes(query.toLowerCase().trim())), [orders, query]);

  const collect = async (order: OrderRecord) => {
    const due = Math.max(0, order.total_fcfa - (order.montant_paye ?? 0));
    const amount = Math.min(due, Math.max(0, Number(amounts[order.id] ?? due) || 0));
    if (!amount) return;
    await recordPayment(order.id, amount, selectedMethod[order.id] ?? 'ESPECES');
    setAmounts((all) => ({ ...all, [order.id]: '' }));
    await reload();
  };

  const closeRegister = () => {
    if (!window.confirm(`Clôturer la caisse du jour ?\nTotal des encaissements : ${formatFCFA(receivedTotal)}`)) return;
    localStorage.setItem(`pressblanchisserie:close:${todayKey()}`, '1');
    setClosed(true);
  };

  return <div className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
    <div className="mb-6"><p className="mb-1 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[.15em] text-blue-600"><Wallet size={14} /> Comptoir & encaissement</p><h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Caisse & remises</h1><p className="mt-1 text-sm text-slate-500">Enregistrez les acomptes et soldes, puis clôturez votre journée.</p></div>

    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,.8fr)]">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center"><div><h2 className="font-extrabold text-slate-900">Soldes à encaisser</h2><p className="mt-1 text-xs text-slate-400">{outstanding.length} commande(s) avec un reste à payer</p></div><label className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 sm:w-[260px]"><Search size={15} className="text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Client, ticket, téléphone" className="w-full border-0 text-xs outline-none focus:ring-0" /></label></div>
        {loading ? <div className="p-10 text-center text-sm text-slate-400">Chargement des soldes…</div> : outstanding.length === 0 ? <div className="p-10 text-center"><div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><Check size={20} /></div><p className="text-sm font-bold text-slate-700">Aucun solde en attente</p><p className="mt-1 text-xs text-slate-400">Les encaissements à effectuer apparaîtront ici.</p></div> : <div className="divide-y divide-slate-100">{outstanding.map((order) => { const due = Math.max(0, order.total_fcfa - (order.montant_paye ?? 0)); return <article key={order.id} className="p-4"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div className="min-w-0"><p className="truncate text-sm font-extrabold text-slate-800">{order.client_nom || 'Client comptoir'} <span className="font-medium text-slate-400">· {order.id}</span></p><p className="mt-0.5 text-xs text-slate-500">{order.client_telephone || 'Sans téléphone'} · {formatFCFA(order.montant_paye ?? 0)} versés sur {formatFCFA(order.total_fcfa)}</p></div><p className="shrink-0 text-sm font-black text-amber-700">Reste {formatFCFA(due)}</p></div>
          <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(130px,.6fr)_1fr_auto] sm:items-end"><label><span className="mb-1 block text-[10px] font-bold text-slate-400">Montant encaissé</span><input type="number" min="0" max={due} value={amounts[order.id] ?? due} onChange={(event) => setAmounts((all) => ({ ...all, [order.id]: event.target.value }))} inputMode="numeric" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-bold outline-none focus:border-blue-400" /></label><div><span className="mb-1 block text-[10px] font-bold text-slate-400">Mode de paiement</span><div className="flex gap-1 overflow-x-auto">{methods.map((method) => <button key={method.id} type="button" onClick={() => setSelectedMethod((all) => ({ ...all, [order.id]: method.id }))} className={cn('h-10 shrink-0 rounded-lg border px-2.5 text-[10px] font-bold', (selectedMethod[order.id] ?? 'ESPECES') === method.id ? 'border-blue-300 bg-blue-50 text-blue-800' : 'border-slate-200 text-slate-500')}>{method.label}</button>)}</div></div><button type="button" disabled={closed} onClick={() => void collect(order)} className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 text-xs font-extrabold text-white hover:bg-blue-700 disabled:bg-slate-300"><CircleDollarSign size={15} /> Encaisser</button></div>
        </article>; })}</div>}
      </section>

      <section className="overflow-hidden rounded-2xl bg-[#09090b] p-5 text-white shadow-lg"><div className="flex items-start justify-between"><div><h2 className="text-base font-black">Clôture de caisse</h2><p className="mt-1 text-xs text-zinc-400">Poste comptoir · {new Date().toLocaleDateString('fr-FR')}</p></div><div className="grid h-10 w-10 place-items-center rounded-xl bg-zinc-800 text-blue-300"><ReceiptText size={19} /></div></div>
        <div className="mt-5 grid grid-cols-2 gap-2">{methods.map((method) => <div key={method.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{method.label}</p><p className="mt-1 text-base font-black">{formatFCFA(receivedByMethod(method.id))}</p></div>)}</div>
        <label className="mt-4 block"><span className="mb-1.5 block text-xs font-bold text-zinc-300">Fond de caisse au démarrage</span><span className="flex h-10 items-center rounded-lg border border-zinc-700 bg-zinc-900 px-3"><input type="number" min="0" value={openingFund} onChange={(event) => setOpeningFund(Math.max(0, Number(event.target.value) || 0))} className="w-full border-0 bg-transparent text-sm font-bold text-white outline-none focus:ring-0" /><span className="text-[10px] font-bold text-zinc-500">FCFA</span></span></label>
        <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-4"><span className="text-sm font-bold text-zinc-300">Total encaissé</span><span className="text-xl font-black">{formatFCFA(receivedTotal)}</span></div><p className="mt-1 text-[11px] text-zinc-400">Espèces attendues : {formatFCFA(openingFund + receivedByMethod('ESPECES'))}</p>
        <button type="button" onClick={closeRegister} disabled={closed} className={cn('mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-extrabold transition', closed ? 'bg-emerald-700 text-white' : 'bg-blue-600 text-white hover:bg-blue-500')}><LockKeyhole size={16} />{closed ? 'Caisse clôturée pour aujourd’hui' : 'Clôture Z · Confirmer'}</button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[10px] text-zinc-500"><Banknote size={12} />Les encaissements sont rattachés aux tickets correspondants.</p>
      </section>
    </div>

    <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><h2 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-800"><Smartphone size={16} className="text-blue-600" /> Derniers paiements</h2><div className="flex flex-wrap gap-2">{orders.flatMap((order) => order.paiements ?? []).filter((payment) => new Date(payment.created_at).toLocaleDateString('fr-CA') === todayKey()).slice(-8).reverse().map((payment) => <span key={payment.id} className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-600">{methodName[payment.method]} · {formatFCFA(payment.amount_fcfa)} · {new Date(payment.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>)}</div></section>
  </div>;
}
