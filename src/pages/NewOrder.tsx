import { useEffect, useState } from 'react';
import { BarChart3, Check, ClipboardList, Cloud, CloudOff, Droplets, Plus, Settings2, Shirt, Sparkles, WashingMachine } from 'lucide-react';
import { BLANCHISSERIE_SERVICES, PRESSING_SERVICES } from '../data/catalog';
import CartSidebar from '../components/order/CartSidebar';
import CheckoutDialog from '../components/order/CheckoutDialog';
import ClothingGrid from '../components/order/ClothingGrid';
import OrderTypeSelector from '../components/order/OrderTypeSelector';
import DashboardPage from './DashboardPage';
import OrdersPage from './OrdersPage';
import SettingsPage from './SettingsPage';
import { useOrderStore } from '../store/useOrderStore';
import { pendingOrderCount, saveOrder, syncPendingOrders } from '../lib/orders';
import type { CheckoutDetails, OrderRecord } from '../types';
import { cn } from '../lib/utils';

type AppPage = 'counter' | 'orders' | 'dashboard' | 'settings';
const navigation: { id: AppPage; label: string; icon: typeof Shirt }[] = [
  { id: 'counter', label: 'Comptoir', icon: Shirt }, { id: 'orders', label: 'Commandes', icon: ClipboardList },
  { id: 'dashboard', label: 'Activité', icon: BarChart3 }, { id: 'settings', label: 'Tarifs', icon: Settings2 }
];

export default function NewOrder() {
  const [online, setOnline] = useState(navigator.onLine);
  const [saving, setSaving] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [page, setPage] = useState<AppPage>('counter');
  const [toast, setToast] = useState<{ message: string; detail: string; pending: boolean } | null>(null);
  const [pending, setPending] = useState(pendingOrderCount());
  const resetCommande = useOrderStore((state) => state.resetCommande);

  useEffect(() => {
    const update = () => {
      setOnline(navigator.onLine);
      if (navigator.onLine) void syncPendingOrders().then(() => setPending(pendingOrderCount()));
    };
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const startNewOrder = () => {
    const current = useOrderStore.getState();
    if ((current.panier.length > 0 || current.poidsKilo > 0) && !window.confirm('Abandonner la commande en cours et repartir de zéro ?')) return;
    resetCommande();
    setPage('counter');
  };

  const completeCheckout = async (details: CheckoutDetails) => {
    if (saving) return;
    const state = useOrderStore.getState();
    const activePrestation = state.serviceActif === 'PRESSING' ? state.prestationPressing : state.prestationBlanchisserie;
    const order: OrderRecord = {
      id: `CMD-${Date.now().toString(36).toUpperCase()}`,
      created_at: new Date().toISOString(),
      service: state.serviceActif,
      prestation: activePrestation,
      mode: state.modeFacturation,
      poids_kg: state.serviceActif === 'PRESSING' && state.modeFacturation === 'KILO' ? state.poidsKilo : null,
      items: state.panier.map((item) => ({ ...item })),
      total_fcfa: state.calculerTotal(),
      sync_status: 'pending',
      client_nom: details.client_nom || undefined,
      client_telephone: details.client_telephone || undefined,
      montant_paye: details.montant_paye,
      moyen_paiement: details.moyen_paiement,
      statut: 'RECU'
    };
    setSaving(true);
    try {
      const status = await saveOrder(order);
      setPending(pendingOrderCount());
      const serviceName = state.serviceActif === 'PRESSING' ? 'Pressing' : 'Blanchisserie';
      const prestationName = (state.serviceActif === 'PRESSING' ? PRESSING_SERVICES : BLANCHISSERIE_SERVICES).find((item) => item.id === activePrestation)?.label ?? activePrestation;
      setToast({ message: `Commande ${order.id} enregistrée`, detail: `${serviceName} · ${prestationName} · ${order.total_fcfa.toLocaleString('fr-FR')} FCFA`, pending: status === 'pending' });
      resetCommande();
      setCheckoutOpen(false);
    } catch {
      setToast({ message: 'Enregistrement impossible', detail: 'Vérifiez le stockage de votre appareil et réessayez.', pending: true });
    } finally {
      setSaving(false);
    }
  };

  return <div className="flex min-h-screen flex-col bg-[#f6f8fb] text-ink lg:h-screen lg:min-h-0 lg:overflow-hidden">
    <header className="z-10 flex min-h-[72px] flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2 shadow-sm sm:px-5 lg:flex-nowrap lg:px-7">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md shadow-blue-600/20"><WashingMachine size={22} strokeWidth={2.2} /></div>
        <div className="hidden min-w-0 xl:block"><p className="truncate text-sm font-black tracking-tight text-slate-900">Comptoir <span className="text-blue-600">Propre.</span></p><p className="text-[10px] font-medium text-slate-500">Abidjan · Réception</p></div>
        <div className={cn('flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-[10px] font-extrabold sm:text-xs', online ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700')} aria-live="polite">
          {online ? <Cloud size={14} /> : <CloudOff size={14} />}<span className={cn('h-2 w-2 rounded-full', online ? 'animate-pulse bg-emerald-500' : 'bg-rose-500')} />{online ? 'En ligne' : 'Hors ligne'}
        </div>
        {pending > 0 && <span className="hidden rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-800 xl:inline">{pending} en attente</span>}
      </div>

      <nav aria-label="Navigation principale" className="order-3 flex w-full items-center gap-1 overflow-x-auto pb-0.5 lg:order-none lg:w-auto">
        {navigation.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setPage(id)} aria-current={page === id ? 'page' : undefined} className={cn('flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-3 text-[11px] font-extrabold transition sm:px-3.5 sm:text-xs', page === id ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800')}><Icon size={15} /><span>{label}</span></button>)}
      </nav>

      <button type="button" onClick={startNewOrder} className="btn btn-primary order-2 flex h-10 min-h-0 shrink-0 items-center gap-1.5 rounded-xl border-0 bg-blue-600 px-3 text-[11px] font-extrabold text-white shadow-md shadow-blue-600/15 hover:bg-blue-700 sm:h-11 sm:px-4 sm:text-xs lg:order-none"><Plus size={16} strokeWidth={3} /><span>Nouvelle commande</span></button>
    </header>

    <main className={cn('min-h-0 flex-1', page === 'counter' ? 'lg:overflow-hidden' : 'overflow-y-auto')}>
      {page === 'counter' ? <div className="grid min-h-full lg:h-full lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex min-w-0 flex-col p-4 sm:p-6 lg:min-h-0 lg:overflow-y-auto lg:px-7 lg:py-5 xl:px-8">
          <div className="mb-4 flex items-end justify-between gap-3"><div><p className="mb-1 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[.15em] text-blue-600"><Sparkles size={13} /> Accueil comptoir</p><h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-[28px]">Nouvelle commande</h1><p className="mt-1 text-xs text-slate-500 sm:text-sm">Un accueil rapide, un suivi précis. On s’occupe du linge.</p></div><div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 xl:flex"><Droplets size={15} className="text-teal-600" /> Réception · Comptoir 01</div></div>
          <OrderTypeSelector /><ClothingGrid />
        </div>
        <div className="min-h-[620px] border-t border-slate-200 lg:min-h-0 lg:border-l lg:border-t-0"><CartSidebar onValidate={() => setCheckoutOpen(true)} /></div>
      </div> : page === 'orders' ? <OrdersPage online={online} /> : page === 'dashboard' ? <DashboardPage /> : <SettingsPage />}
    </main>

    <CheckoutDialog open={checkoutOpen} onOpenChange={setCheckoutOpen} onConfirm={(details) => void completeCheckout(details)} loading={saving} />
    {toast && <div role="status" className="animate-slide-in fixed bottom-5 left-1/2 z-[60] w-[min(92vw,430px)] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:bottom-7 sm:left-auto sm:right-7 sm:translate-x-0"><div className="flex gap-3"><div className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', toast.pending ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700')}>{toast.pending ? <CloudOff size={19} /> : <Check size={19} />}</div><div className="min-w-0 flex-1"><p className="text-sm font-extrabold text-slate-900">{toast.message}</p><p className="mt-0.5 text-xs text-slate-500">{toast.detail}</p><p className={cn('mt-1 text-[10px] font-bold', toast.pending ? 'text-amber-700' : 'text-emerald-700')}>{toast.pending ? 'Conservée sur cet appareil · synchronisation en attente' : 'Synchronisée avec votre espace'}</p></div><button type="button" aria-label="Fermer" className="h-7 px-1 text-slate-400" onClick={() => setToast(null)}>×</button></div></div>}
  </div>;
}
