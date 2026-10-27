import { useEffect, useState } from 'react';
import { Check, Cloud, CloudOff, Droplets, Plus, Sparkles, WashingMachine } from 'lucide-react';
import { BLANCHISSERIE_SERVICES, PRESSING_SERVICES } from '../data/catalog';
import CartSidebar from '../components/order/CartSidebar';
import ClothingGrid from '../components/order/ClothingGrid';
import OrderTypeSelector from '../components/order/OrderTypeSelector';
import { useOrderStore } from '../store/useOrderStore';
import { pendingOrderCount, saveOrder, syncPendingOrders } from '../lib/orders';
import type { OrderRecord } from '../types';
import { cn } from '../lib/utils';

export default function NewOrder() {
  const [online, setOnline] = useState(navigator.onLine);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; detail: string; pending: boolean } | null>(null);
  const [pending, setPending] = useState(pendingOrderCount());
  const resetCommande = useOrderStore((state) => state.resetCommande);

  useEffect(() => {
    const update = () => {
      setOnline(navigator.onLine);
      if (navigator.onLine) void syncPendingOrders().then((count) => { if (count) setPending(pendingOrderCount()); });
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
  };

  const validateOrder = async () => {
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
      sync_status: 'pending'
    };
    setSaving(true);
    try {
      const status = await saveOrder(order);
      setPending(pendingOrderCount());
      const serviceName = state.serviceActif === 'PRESSING' ? 'Pressing' : 'Blanchisserie';
      const prestationName = (state.serviceActif === 'PRESSING' ? PRESSING_SERVICES : BLANCHISSERIE_SERVICES).find((item) => item.id === activePrestation)?.label ?? activePrestation;
      setToast({ message: `Commande ${order.id} enregistrée`, detail: `${serviceName} · ${prestationName} · ${order.total_fcfa.toLocaleString('fr-FR')} FCFA`, pending: status === 'pending' });
      resetCommande();
    } catch {
      setToast({ message: 'Enregistrement impossible', detail: 'Vérifiez le stockage de votre appareil et réessayez.', pending: true });
    } finally {
      setSaving(false);
    }
  };

  return <div className="flex min-h-screen flex-col bg-[#f6f8fb] text-ink lg:h-screen lg:min-h-0 lg:overflow-hidden">
    <header className="z-10 flex min-h-[72px] items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md shadow-blue-600/20"><WashingMachine size={23} strokeWidth={2.2} /></div>
        <div className="min-w-0"><p className="truncate text-sm font-black tracking-tight text-slate-900 sm:text-base">Comptoir <span className="text-blue-600">Propre.</span></p><p className="hidden text-[11px] font-medium text-slate-500 sm:block">Gestion des commandes</p></div>
        <div className={cn('ml-1 flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-extrabold sm:ml-4 sm:px-3 sm:text-xs', online ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700')} aria-live="polite">
          {online ? <Cloud size={14} /> : <CloudOff size={14} />}<span className={cn('h-2 w-2 rounded-full', online ? 'animate-pulse bg-emerald-500' : 'bg-rose-500')} />{online ? 'En ligne' : 'Hors ligne'}
        </div>
        {pending > 0 && <span className="hidden rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-800 md:inline">{pending} à synchroniser</span>}
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden text-right md:block"><p className="text-xs font-bold text-slate-700">Espace réception</p><p className="text-[10px] text-slate-400">Abidjan · Côte d’Ivoire</p></div>
        <button type="button" onClick={startNewOrder} className="btn btn-primary flex h-11 min-h-0 items-center gap-2 rounded-xl border-0 bg-blue-600 px-3 text-xs font-extrabold text-white shadow-md shadow-blue-600/15 hover:bg-blue-700 sm:h-12 sm:px-4 sm:text-sm"><Plus size={17} strokeWidth={3} /><span>Nouvelle commande</span></button>
      </div>
    </header>

    <main className="min-h-0 flex-1 lg:overflow-hidden">
      <div className="grid min-h-full lg:h-full lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex min-w-0 flex-col p-4 sm:p-6 lg:min-h-0 lg:overflow-y-auto lg:px-7 lg:py-5 xl:px-8">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div><p className="mb-1 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[.15em] text-blue-600"><Sparkles size={13} /> Accueil comptoir</p><h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-[28px]">Nouvelle commande</h1><p className="mt-1 text-xs text-slate-500 sm:text-sm">Un accueil rapide, un suivi précis. On s’occupe du linge.</p></div>
            <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 xl:flex"><Droplets size={15} className="text-teal-600" /> Réception · Comptoir 01</div>
          </div>
          <OrderTypeSelector />
          <ClothingGrid />
        </div>
        <div className="min-h-[620px] border-t border-slate-200 lg:min-h-0 lg:border-l lg:border-t-0">
          <CartSidebar onValidate={validateOrder} isSaving={saving} />
        </div>
      </div>
    </main>

    {toast && <div role="status" className="animate-slide-in fixed bottom-5 left-1/2 z-50 w-[min(92vw,430px)] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:bottom-7 sm:left-auto sm:right-7 sm:translate-x-0">
      <div className="flex gap-3"><div className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', toast.pending ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700')}>{toast.pending ? <CloudOff size={19} /> : <Check size={19} />}</div><div className="min-w-0 flex-1"><p className="text-sm font-extrabold text-slate-900">{toast.message}</p><p className="mt-0.5 text-xs text-slate-500">{toast.detail}</p><p className={cn('mt-1 text-[10px] font-bold', toast.pending ? 'text-amber-700' : 'text-emerald-700')}>{toast.pending ? 'Conservée sur cet appareil · synchronisation en attente' : 'Synchronisée avec votre espace'}</p></div><button type="button" aria-label="Fermer" className="h-7 px-1 text-slate-400" onClick={() => setToast(null)}>×</button></div>
    </div>}
  </div>;
}
