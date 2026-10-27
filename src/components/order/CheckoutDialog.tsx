import { useEffect, useState } from 'react';
import { Banknote, Smartphone, UserRound, Wallet } from 'lucide-react';
import { useOrderStore } from '../../store/useOrderStore';
import type { CheckoutDetails, PaymentMethod } from '../../types';
import { formatFCFA } from './CartSidebar';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog';

type CheckoutDialogProps = { open: boolean; onOpenChange: (open: boolean) => void; onConfirm: (details: CheckoutDetails) => void; loading?: boolean };

export default function CheckoutDialog({ open, onOpenChange, onConfirm, loading = false }: CheckoutDialogProps) {
  const total = useOrderStore((state) => state.calculerTotal());
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('0');
  const [method, setMethod] = useState<PaymentMethod>('ESPECES');

  useEffect(() => {
    if (open) { setName(''); setPhone(''); setAmount('0'); setMethod('ESPECES'); }
  }, [open]);

  const rawPaid = Math.max(0, Number(amount) || 0);
  const paid = Math.min(total, rawPaid);
  const remain = Math.max(0, total - paid);
  const paymentOptions: { id: PaymentMethod; label: string; icon: typeof Banknote }[] = [
    { id: 'ESPECES', label: 'Espèces', icon: Banknote }, { id: 'MOBILE_MONEY', label: 'Mobile money', icon: Smartphone }
  ];

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl p-0 sm:max-w-[520px]">
      <div className="bg-gradient-to-br from-blue-700 to-blue-600 px-6 py-5 text-white">
        <p className="text-xs font-bold uppercase tracking-[.15em] text-blue-100">Dernière étape</p>
        <DialogTitle className="mt-1 text-xl font-black">Finaliser la commande</DialogTitle>
        <DialogDescription className="mt-1 text-sm text-blue-100">Renseignez le contact et l’encaissement. Ces informations sont facultatives.</DialogDescription>
        <p className="mt-4 text-3xl font-black">{formatFCFA(total)}</p>
      </div>
      <div className="space-y-5 p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block"><span className="mb-1.5 block text-xs font-extrabold text-slate-600">Nom du client</span><span className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 focus-within:border-blue-400"><UserRound size={16} className="text-slate-400" /><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex. Aïssata Koné" className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none focus:ring-0" /></span></label>
          <label className="block"><span className="mb-1.5 block text-xs font-extrabold text-slate-600">Téléphone</span><input value={phone} onChange={(event) => setPhone(event.target.value.replace(/[^0-9+ ]/g, ''))} placeholder="07 00 00 00 00" inputMode="tel" className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /></label>
        </div>

        <section>
          <div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-extrabold text-slate-800">Encaissement</h3><span className="text-xs font-bold text-slate-500">Reste {formatFCFA(remain)}</span></div>
          <div className="mb-3 flex gap-2">
            <button type="button" onClick={() => setAmount(String(total))} className="h-9 rounded-lg bg-blue-50 px-3 text-xs font-bold text-blue-700 hover:bg-blue-100">Payer le total</button>
            <button type="button" onClick={() => setAmount('0')} className="h-9 rounded-lg bg-slate-100 px-3 text-xs font-bold text-slate-600 hover:bg-slate-200">Plus tard</button>
          </div>
          <label className="mb-3 block"><span className="mb-1.5 block text-xs font-bold text-slate-500">Montant reçu (FCFA)</span><input type="number" min="0" max={total} step="1" value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="numeric" className="h-12 w-full rounded-xl border border-slate-200 px-4 text-lg font-extrabold outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /></label>
          {rawPaid > total && <p className="mb-2 text-xs font-bold text-rose-600">Le montant reçu ne peut pas dépasser le total à payer.</p>}
          {paid > 0 && <div className="grid grid-cols-2 gap-2">{paymentOptions.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setMethod(id)} className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-bold transition ${method === id ? 'border-blue-300 bg-blue-50 text-blue-800 ring-1 ring-blue-100' : 'border-slate-200 text-slate-600'}`}><Icon size={17} />{label}</button>)}</div>}
        </section>
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800"><Wallet size={15} className="mt-0.5 shrink-0" /><p>Le solde restant sera visible dans l’historique. Vous pourrez suivre la commande jusqu’au retrait.</p></div>
        <div className="flex gap-3"><Button variant="outline" className="h-12 flex-1" onClick={() => onOpenChange(false)} disabled={loading}>Retour</Button><Button className="h-12 flex-[1.4] bg-blue-600 text-base" onClick={() => onConfirm({ client_nom: name.trim(), client_telephone: phone.trim(), montant_paye: paid, moyen_paiement: paid > 0 ? method : 'NON_PAYE' })} disabled={loading || rawPaid > total}>{loading ? 'Enregistrement…' : 'Enregistrer la commande'}</Button></div>
      </div>
    </DialogContent>
  </Dialog>;
}
