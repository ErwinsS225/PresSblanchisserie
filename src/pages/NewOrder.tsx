import { useEffect, useState } from 'react';
import { Check, ClipboardList, Cloud, CloudOff, Droplets, LayoutDashboard, Plus, Printer, Settings2, Shirt, Users, WashingMachine, Wallet, Wind } from 'lucide-react';
import { BLANCHISSERIE_SERVICES, PRESSING_SERVICES } from '../data/catalog';
import CashPage from './CashPage';
import ClientsPage from './ClientsPage';
import DashboardPage from './DashboardPage';
import OrdersPage from './OrdersPage';
import ProductionPage from './ProductionPage';
import SettingsPage from './SettingsPage';
import CartSidebar from '../components/order/CartSidebar';
import CheckoutDialog from '../components/order/CheckoutDialog';
import ClothingGrid from '../components/order/ClothingGrid';
import OrderTypeSelector from '../components/order/OrderTypeSelector';
import { useOrderStore } from '../store/useOrderStore';
import { pendingOrderCount, saveOrder, syncPendingOrders } from '../lib/orders';
import type { CheckoutDetails, OrderRecord } from '../types';
import { cn } from '../lib/utils';

type AppPage = 'counter' | 'orders' | 'production' | 'cash' | 'clients' | 'dashboard' | 'settings';
const navigation: { id: AppPage; label: string; icon: typeof Shirt }[] = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard }, { id: 'counter', label: 'Réception', icon: Shirt },
  { id: 'production', label: 'Production', icon: Wind }, { id: 'cash', label: 'Remises & caisse', icon: Wallet },
  { id: 'orders', label: 'Commandes', icon: ClipboardList }, { id: 'clients', label: 'Clients', icon: Users }, { id: 'settings', label: 'Paramètres', icon: Settings2 }
];
const pageTitle: Record<AppPage, string> = { dashboard: 'Tableau de bord', counter: 'Nouvelle réception', production: 'Production & remises', cash: 'Caisse', orders: 'Commandes', clients: 'Clients', settings: 'Paramètres' };
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character] ?? character);

export default function NewOrder() {
  const [online, setOnline] = useState(navigator.onLine);
  const [saving, setSaving] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [page, setPage] = useState<AppPage>('dashboard');
  const [toast, setToast] = useState<{ message: string; detail: string; pending: boolean; ticket?: OrderRecord } | null>(null);
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
    setCheckoutOpen(false);
    setPage('counter');
  };

  const completeCheckout = async (details: CheckoutDetails) => {
    if (saving) return;
    const state = useOrderStore.getState();
    const activePrestation = state.serviceActif === 'PRESSING' ? state.prestationPressing : state.prestationBlanchisserie;
    const total = Math.round(state.calculerTotal() * (details.express ? 1.5 : 1));
    const created = new Date().toISOString();
    const order: OrderRecord = {
      id: `CMD-${Date.now().toString(36).toUpperCase()}`,
      created_at: created,
      service: state.serviceActif,
      prestation: activePrestation,
      mode: state.modeFacturation,
      poids_kg: state.serviceActif === 'PRESSING' && state.modeFacturation === 'KILO' ? state.poidsKilo : null,
      items: state.panier.map((item) => ({ ...item })),
      total_fcfa: total,
      sync_status: 'pending',
      client_nom: details.client_nom || undefined,
      client_telephone: details.client_telephone || undefined,
      montant_paye: details.montant_paye,
      moyen_paiement: details.moyen_paiement,
      paiements: details.montant_paye > 0 ? [{ id: `PAY-${Date.now().toString(36).toUpperCase()}`, created_at: created, amount_fcfa: details.montant_paye, method: details.moyen_paiement as Exclude<typeof details.moyen_paiement, 'NON_PAYE'> }] : [],
      statut: 'RECU',
      retrait_prevu: details.retrait_prevu,
      express: details.express,
      consignes: details.consignes || undefined
    };
    setSaving(true);
    try {
      const syncStatus = await saveOrder(order);
      setPending(pendingOrderCount());
      const serviceName = state.serviceActif === 'PRESSING' ? 'Pressing' : 'Blanchisserie';
      const prestationName = (state.serviceActif === 'PRESSING' ? PRESSING_SERVICES : BLANCHISSERIE_SERVICES).find((item) => item.id === activePrestation)?.label ?? activePrestation;
      setToast({ message: `Ticket ${order.id} enregistré`, detail: `${serviceName} · ${prestationName} · ${total.toLocaleString('fr-FR')} FCFA`, pending: syncStatus === 'pending', ticket: order });
      resetCommande();
      setCheckoutOpen(false);
      setPage('production');
    } catch {
      setToast({ message: 'Enregistrement impossible', detail: 'Vérifiez le stockage de votre appareil et réessayez.', pending: true });
    } finally { setSaving(false); }
  };

  const printTicket = (order: OrderRecord) => {
    const printWindow = window.open('', '_blank', 'width=420,height=720');
    if (!printWindow) return;
    const rows = order.items.map((item) => `<tr><td>${item.quantite} × ${escapeHtml(item.vetement.nom)}</td><td>${item.prixUnitaire ? `${(item.quantite * item.prixUnitaire).toLocaleString('fr-FR')} F` : '—'}</td></tr>`).join('');
    const paid = order.montant_paye ?? 0;
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Ticket ${escapeHtml(order.id)}</title><style>body{font:14px Arial,sans-serif;color:#111;margin:22px}h1{font-size:20px;margin:0}p{margin:5px 0}.muted{color:#666;font-size:12px}.line{border-top:1px dashed #888;margin:14px 0}table{width:100%;border-collapse:collapse}td{padding:5px 0}td:last-child{text-align:right}.total{font-size:20px;font-weight:bold}.center{text-align:center}footer{margin-top:20px;font-size:11px;text-align:center;color:#555}</style></head><body><div class="center"><h1>Pressing Pro CI</h1><p class="muted">Cocody, Abidjan · Merci pour votre confiance</p></div><div class="line"></div><p><b>Ticket :</b> ${escapeHtml(order.id)}</p><p><b>Date :</b> ${new Date(order.created_at).toLocaleString('fr-FR')}</p><p><b>Client :</b> ${escapeHtml(order.client_nom || 'Client comptoir')}</p><p><b>Téléphone :</b> ${escapeHtml(order.client_telephone || '—')}</p><p><b>Service :</b> ${escapeHtml(order.service === 'PRESSING' ? 'Pressing' : 'Blanchisserie')} · ${escapeHtml(order.prestation.replace(/_/g, ' ').toLowerCase())}</p>${order.poids_kg ? `<p><b>Poids :</b> ${order.poids_kg} kg</p>` : ''}<div class="line"></div><table>${rows}</table><div class="line"></div><p class="total">Total : ${order.total_fcfa.toLocaleString('fr-FR')} FCFA</p><p>Payé : ${paid.toLocaleString('fr-FR')} FCFA</p><p>Reste : ${Math.max(0, order.total_fcfa - paid).toLocaleString('fr-FR')} FCFA</p>${order.retrait_prevu ? `<p><b>Retrait prévu :</b> ${new Date(order.retrait_prevu).toLocaleString('fr-FR')}</p>` : ''}${order.consignes ? `<p><b>Consignes :</b> ${escapeHtml(order.consignes)}</p>` : ''}<footer>Conservez ce ticket pour le retrait de vos articles.</footer><script>window.onload=()=>window.print()</script></body></html>`;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return <div className="flex min-h-screen bg-[#f4f4f5] text-zinc-900 lg:h-screen lg:min-h-0 lg:overflow-hidden">
    <aside className="hidden w-[240px] shrink-0 flex-col rounded-r-2xl bg-[#09090b] p-5 text-white lg:my-3 lg:ml-3 lg:flex">
      <div className="mb-8 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-lg font-black">P</div><div><p className="text-[15px] font-black leading-tight">Pressing Pro CI</p><p className="text-[11px] text-zinc-400">Cocody, Abidjan</p></div></div>
      <nav className="space-y-1" aria-label="Navigation principale">{navigation.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setPage(id)} aria-current={page === id ? 'page' : undefined} className={cn('flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-[13px] font-semibold transition', page === id ? 'bg-white text-black' : 'text-zinc-300 hover:bg-zinc-800')}><Icon size={17} />{label}{id === 'counter' && <span className={cn('ml-auto rounded-full px-2 py-0.5 text-[10px] font-black', page === id ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-300')}>{pending}</span>}</button>)}</nav>
      <div className="mt-auto"><div className="mb-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">État du comptoir</p><p className="mt-1 flex items-center gap-2 text-xs font-bold">{online ? <span className="h-2 w-2 rounded-full bg-emerald-400" /> : <span className="h-2 w-2 rounded-full bg-rose-500" />}{online ? 'Connexion active' : 'Mode hors ligne'}</p><p className="mt-1 text-[10px] text-zinc-400">{pending} ticket(s) en attente de synchro</p></div><div className="flex items-center gap-2.5"><div className="grid h-9 w-9 place-items-center rounded-full bg-amber-500 text-xs font-black text-zinc-950">PC</div><div><p className="text-[12px] font-semibold">Équipe comptoir</p><p className="text-[10px] text-zinc-400">Poste 01 · Abidjan</p></div></div></div>
    </aside>

    <div className="flex min-w-0 flex-1 flex-col lg:min-h-0">
      <header className="z-10 border-b border-zinc-200 bg-white shadow-sm">
        <div className="flex min-h-[64px] items-center justify-between gap-3 px-3 py-2 sm:px-5 lg:px-6">
          <div className="flex min-w-0 items-center gap-2"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-600 text-white lg:hidden"><WashingMachine size={19} /></div><div className="min-w-0"><h1 className="truncate text-base font-black tracking-tight sm:text-lg">{pageTitle[page]}</h1><p className="hidden text-[11px] text-zinc-500 sm:block">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · Presse Cocody — Comptoir 01</p></div></div>
          <div className="flex shrink-0 items-center gap-2"><div className={cn('flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-[10px] font-extrabold sm:text-xs', online ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700')} aria-live="polite">{online ? <Cloud size={13} /> : <CloudOff size={13} />}<span className={cn('h-2 w-2 rounded-full', online ? 'animate-pulse bg-emerald-500' : 'bg-rose-500')} />{online ? 'En ligne' : 'Hors ligne'}</div><button type="button" onClick={startNewOrder} className="btn btn-primary flex h-10 min-h-0 items-center gap-1.5 rounded-lg border-0 bg-[#09090b] px-3 text-[11px] font-extrabold text-white hover:bg-zinc-800 sm:px-4 sm:text-xs"><Plus size={16} strokeWidth={3} /><span className="hidden sm:inline">Nouvelle réception</span><span className="sm:hidden">Réception</span></button></div>
        </div>
        <nav className="flex items-center gap-1 overflow-x-auto border-t border-zinc-100 px-3 py-1.5 lg:hidden" aria-label="Navigation mobile">{navigation.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setPage(id)} className={cn('flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[10px] font-extrabold', page === id ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-100')}><Icon size={14} />{label}</button>)}</nav>
      </header>

      <main className={cn('min-h-0 flex-1', page === 'counter' ? 'lg:overflow-hidden' : 'overflow-y-auto')}>
        {page === 'counter' ? <div className="grid min-h-full lg:h-full lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="flex min-w-0 flex-col p-4 sm:p-5 lg:p-6 lg:min-h-0 lg:overflow-y-auto lg:px-5 lg:py-4 xl:px-6"><div className="mb-3"><p className="mb-1 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[.15em] text-blue-600"><Droplets size={12} /> Dépôt client au comptoir</p><h2 className="text-xl font-black tracking-tight text-slate-900">Articles & services</h2><p className="mt-1 text-xs text-slate-500">Sélectionnez les vêtements et la prestation souhaitée.</p></div><OrderTypeSelector /><ClothingGrid /></div>
          <div className="min-h-[620px] border-t border-zinc-200 lg:min-h-0 lg:border-l lg:border-t-0"><CartSidebar onValidate={() => setCheckoutOpen(true)} /></div>
        </div> : page === 'dashboard' ? <DashboardPage onReception={() => setPage('counter')} onCash={() => setPage('cash')} onProduction={() => setPage('production')} /> : page === 'orders' ? <OrdersPage online={online} onOpenCash={() => setPage('cash')} /> : page === 'production' ? <ProductionPage onOpenCash={() => setPage('cash')} /> : page === 'cash' ? <CashPage /> : page === 'clients' ? <ClientsPage /> : <SettingsPage />}
      </main>
    </div>

    <CheckoutDialog open={checkoutOpen} onOpenChange={setCheckoutOpen} onConfirm={(details) => void completeCheckout(details)} loading={saving} />
    {toast && <div role="status" className="animate-slide-in fixed bottom-5 left-1/2 z-[60] w-[min(92vw,430px)] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:bottom-7 sm:left-auto sm:right-7 sm:translate-x-0"><div className="flex gap-3"><div className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', toast.pending ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700')}>{toast.pending ? <CloudOff size={19} /> : <Check size={19} />}</div><div className="min-w-0 flex-1"><p className="text-sm font-extrabold text-slate-900">{toast.message}</p><p className="mt-0.5 text-xs text-slate-500">{toast.detail}</p><p className={cn('mt-1 text-[10px] font-bold', toast.pending ? 'text-amber-700' : 'text-emerald-700')}>{toast.pending ? 'Conservée sur cet appareil · synchronisation en attente' : 'Synchronisée avec votre espace'}</p></div>{toast.ticket && <button type="button" onClick={() => printTicket(toast.ticket!)} className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-2 text-[10px] font-extrabold text-slate-600 hover:bg-slate-50"><Printer size={14} /> Imprimer</button>}<button type="button" aria-label="Fermer" className="h-7 px-1 text-slate-400" onClick={() => setToast(null)}>×</button></div></div>}
  </div>;
}
