import { useEffect, useState } from 'react';
import { Banknote, CalendarClock, Smartphone, UserRound, Wallet } from 'lucide-react';
import { useOrderStore } from '../../store/useOrderStore';
import { listOrders } from '../../lib/orders';
import type { CheckoutDetails, PaymentMethod } from '../../types';
import { formatFCFA } from './CartSidebar';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog';

type CheckoutDialogProps = { open: boolean; onOpenChange: (open: boolean) => void; onConfirm: (details: CheckoutDetails) => void; loading?: boolean };
const dateAfter = (days: number) => { const date = new Date(); date.setDate(date.getDate() + days); date.setHours(17, 0, 0, 0); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`; };
type KnownClient = { name: string; phone: string; count: number; balance: number };

export default function CheckoutDialog({ open, onOpenChange, onConfirm, loading = false }: CheckoutDialogProps) {
  const baseTotal = useOrderStore((state) => state.calculerTotal());
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('0');
  const [method, setMethod] = useState<PaymentMethod>('ESPECES');
  const [express, setExpress] = useState(false);
  const [pickupAt, setPickupAt] = useState(dateAfter(2));
  const [instructions, setInstructions] = useState('');
  const [knownClients, setKnownClients] = useState<KnownClient[]>([]);
  const [selectedClient, setSelectedClient] = useState<KnownClient | null>(null);

  useEffect(() => {
    if (open) { setName(''); setPhone(''); setAmount('0'); setMethod('ESPECES'); setExpress(false); setPickupAt(dateAfter(2)); setInstructions(''); setSelectedClient(null); }
  }, [open]);
  useEffect(() => {
    if (!open) return;
    void listOrders().then((orders) => {
      const clients = new Map<string, KnownClient>();
      for (const order of orders) {
        if (!order.client_telephone) continue;
        const key = order.client_telephone.replace(/\s/g, '');
        const previous = clients.get(key) ?? { name: order.client_nom || 'Client', phone: order.client_telephone, count: 0, balance: 0 };
        previous.count += 1;
        previous.balance += Math.max(0, order.total_fcfa - (order.montant_paye ?? 0));
        clients.set(key, previous);
      }
      setKnownClients([...clients.values()]);
    });
  }, [open]);

  const total = Math.round(baseTotal * (express ? 1.5 : 1));
  const rawPaid = Math.max(0, Number(amount) || 0);
  const paid = Math.min(total, rawPaid);
  const remain = Math.max(0, total - paid);
  const phoneQuery = phone.replace(/[^0-9]/g, '');
  const matchingClients = phoneQuery.length >= 3 && !selectedClient ? knownClients.filter((client) => client.phone.replace(/[^0-9]/g, '').includes(phoneQuery)).slice(0, 4) : [];
  const paymentOptions: { id: Exclude<PaymentMethod, 'NON_PAYE'>; label: string; icon: typeof Banknote }[] = [
    { id: 'ESPECES', label: 'Espèces', icon: Banknote }, { id: 'WAVE', label: 'Wave', icon: Smartphone },
    { id: 'MTN_MONEY', label: 'MTN MoMo', icon: Smartphone }, { id: 'ORANGE_MONEY', label: 'Orange Money', icon: Smartphone }
  ];

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl p-0 sm:max-w-[560px]">
      <div className="bg-gradient-to-br from-blue-700 to-blue-600 px-6 py-5 text-white">
        <p className="text-xs font-bold uppercase tracking-[.15em] text-blue-100">Dernière étape</p>
        <DialogTitle className="mt-1 text-xl font-black">Finaliser la commande</DialogTitle>
        <DialogDescription className="mt-1 text-sm text-blue-100">Contact, date de retrait et acompte — les informations client sont facultatives.</DialogDescription>
        <div className="mt-4 flex items-end justify-between gap-3"><p className="text-3xl font-black">{formatFCFA(total)}</p>{express && <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-extrabold">Express +50 %</span>}</div>
      </div>
      <div className="space-y-5 p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block"><span className="mb-1.5 block text-xs font-extrabold text-slate-600">Nom du client</span><span className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 focus-within:border-blue-400"><UserRound size={16} className="text-slate-400" /><input value={name} onChange={(event) => { setName(event.target.value); setSelectedClient(null); }} placeholder="Ex. Aïssata Koné" className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none focus:ring-0" /></span></label>
          <div className="relative"><label className="block"><span className="mb-1.5 block text-xs font-extrabold text-slate-600">Téléphone</span><input value={phone} onChange={(event) => { setPhone(event.target.value.replace(/[^0-9+ ]/g, '')); setSelectedClient(null); }} placeholder="07 00 00 00 00" inputMode="tel" className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /></label>
            {selectedClient && <p className="mt-1 text-[10px] font-bold text-emerald-700">✓ Fiche retrouvée · {selectedClient.count} dépôts · Solde {formatFCFA(selectedClient.balance)}</p>}
            {matchingClients.length > 0 && <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">{matchingClients.map((client) => <button key={client.phone} type="button" onClick={() => { setName(client.name); setPhone(client.phone); setSelectedClient(client); }} className="flex w-full items-center justify-between gap-2 border-b border-slate-100 px-3 py-2.5 text-left last:border-0 hover:bg-blue-50"><span><span className="block text-xs font-extrabold text-slate-800">{client.name}</span><span className="text-[10px] text-slate-400">{client.phone} · {client.count} dépôts</span></span><span className="text-[10px] font-bold text-amber-700">Solde {formatFCFA(client.balance)}</span></button>)}</div>}
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 p-4">
          <div className="mb-3 flex items-center gap-2"><CalendarClock size={17} className="text-blue-600" /><h3 className="text-sm font-extrabold text-slate-800">Retrait & consignes</h3></div>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <label className="block"><span className="mb-1 block text-[11px] font-bold text-slate-500">Date et heure de retrait</span><input type="datetime-local" value={pickupAt} onChange={(event) => setPickupAt(event.target.value)} className="h-10 w-full rounded-lg border border-slate-200 px-2 text-xs font-semibold outline-none focus:border-blue-400" /></label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-extrabold text-amber-800"><input type="checkbox" checked={express} onChange={(event) => setExpress(event.target.checked)} className="checkbox checkbox-sm rounded border-amber-300 checked:border-blue-600 checked:bg-blue-600" /> Express +50 %</label>
          </div>
          <textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} rows={2} placeholder="Consigne : détachage doux, linge délicat…" className="mt-2 w-full resize-none rounded-lg border border-slate-200 p-3 text-xs outline-none placeholder:text-slate-400 focus:border-blue-400" />
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-extrabold text-slate-800">Acompte reçu</h3><span className="text-xs font-bold text-slate-500">Reste {formatFCFA(remain)}</span></div>
          <div className="mb-3 flex gap-2"><button type="button" onClick={() => setAmount(String(total))} className="h-9 rounded-lg bg-blue-50 px-3 text-xs font-bold text-blue-700 hover:bg-blue-100">Payer le total</button><button type="button" onClick={() => setAmount('0')} className="h-9 rounded-lg bg-slate-100 px-3 text-xs font-bold text-slate-600 hover:bg-slate-200">Plus tard</button></div>
          <label className="mb-2 block"><span className="mb-1.5 block text-xs font-bold text-slate-500">Montant reçu (FCFA)</span><input type="number" min="0" max={total} step="1" value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="numeric" className="h-12 w-full rounded-xl border border-slate-200 px-4 text-lg font-extrabold outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /></label>
          {rawPaid > total && <p className="mb-2 text-xs font-bold text-rose-600">Le montant reçu ne peut pas dépasser le total à payer.</p>}
          {paid > 0 && <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{paymentOptions.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setMethod(id)} className={`flex h-10 items-center justify-center gap-1.5 rounded-xl border text-xs font-bold transition ${method === id ? 'border-blue-300 bg-blue-50 text-blue-800 ring-1 ring-blue-100' : 'border-slate-200 text-slate-600'}`}><Icon size={15} />{label}</button>)}</div>}
        </section>
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800"><Wallet size={15} className="mt-0.5 shrink-0" /><p>Le solde et le mode de paiement seront visibles dans l’historique. Aucun SMS n’est envoyé tant qu’un fournisseur SMS n’est pas configuré.</p></div>
        <div className="flex gap-3"><Button variant="outline" className="h-12 flex-1" onClick={() => onOpenChange(false)} disabled={loading}>Retour</Button><Button className="h-12 flex-[1.4] bg-blue-600 text-base" onClick={() => onConfirm({ client_nom: name.trim(), client_telephone: phone.trim(), montant_paye: paid, moyen_paiement: paid > 0 ? method : 'NON_PAYE', retrait_prevu: pickupAt, express, consignes: instructions.trim() })} disabled={loading || rawPaid > total}>{loading ? 'Enregistrement…' : 'Valider la commande'}</Button></div>
      </div>
    </DialogContent>
  </Dialog>;
}
