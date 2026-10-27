import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, Check, ChevronDown, ChevronUp, Minus, Plus, ReceiptText, Scale, Trash2 } from 'lucide-react';
import { useOrderStore } from '../../store/useOrderStore';
import { cn } from '../../lib/utils';
import { ClothingIcon } from './ClothingIcon';

export const formatFCFA = (amount: number) => `${Math.round(amount).toLocaleString('fr-FR')} FCFA`;

type CartSidebarProps = { onValidate: () => void; isSaving?: boolean };

export default function CartSidebar({ onValidate, isSaving = false }: CartSidebarProps) {
  const service = useOrderStore((state) => state.serviceActif);
  const mode = useOrderStore((state) => state.modeFacturation);
  const panier = useOrderStore((state) => state.panier);
  const poids = useOrderStore((state) => state.poidsKilo);
  const tarifKilo = useOrderStore((state) => state.tarifKilo);
  const forfaits = useOrderStore((state) => state.forfaitConfigs);
  const prestationBlanchisserie = useOrderStore((state) => state.prestationBlanchisserie);
  const setPoids = useOrderStore((state) => state.setPoids);
  const add = useOrderStore((state) => state.ajouterVetement);
  const remove = useOrderStore((state) => state.retirerVetement);
  const reset = useOrderStore((state) => state.resetCommande);
  const total = useOrderStore((state) => state.calculerTotal());
  const pieces = useOrderStore((state) => state.nombrePieces());
  const config = forfaits[prestationBlanchisserie];
  const [showPad, setShowPad] = useState(true);
  const [weightDraft, setWeightDraft] = useState(poids === 0 ? '0' : String(poids));
  const [confirmReset, setConfirmReset] = useState(false);
  const canValidate = panier.length > 0 && (service !== 'PRESSING' || mode !== 'KILO' || poids > 0);
  const isForfait = service === 'BLANCHISSERIE' && mode === 'FORFAIT';
  const progress = useMemo(() => Math.min(100, Math.round((pieces / config.nbPiecesRequis) * 100)), [pieces, config.nbPiecesRequis]);

  // Répercute un reset externe sans interrompre la saisie d'une décimale (ex. « 0, »).
  useEffect(() => {
    if ((Number.parseFloat(weightDraft) || 0) !== poids) setWeightDraft(poids === 0 ? '0' : String(poids));
  }, [poids, weightDraft]);

  const enterDigit = (digit: string) => {
    if (digit === '.' && weightDraft.includes('.')) return;
    if (digit === '.' && weightDraft.includes('.') && weightDraft.length - (weightDraft.indexOf('.') + 1) >= 2) return;
    let next = weightDraft;
    if (digit === '.') next = `${weightDraft || '0'}.`;
    else next = weightDraft === '0' ? digit : `${weightDraft}${digit}`;
    setWeightDraft(next);
    if (!next.endsWith('.')) setPoids(Number(next));
  };
  const deleteDigit = () => {
    const next = weightDraft.slice(0, -1) || '0';
    setWeightDraft(next);
    setPoids(Number.parseFloat(next) || 0);
  };

  return (
    <aside className="flex h-full min-h-0 flex-col border-l border-slate-200 bg-white" aria-label="Panier de commande">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700"><ReceiptText size={20} /></div>
          <div><h2 className="font-extrabold text-slate-900">Panier</h2><p className="text-xs font-medium text-slate-500">{pieces} pièce{pieces > 1 ? 's' : ''} sélectionnée{pieces > 1 ? 's' : ''}</p></div>
        </div>
        {panier.length > 0 && <button type="button" onClick={() => setConfirmReset(true)} className="grid h-10 w-10 place-items-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Vider le panier"><Trash2 size={17} /></button>}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {service === 'PRESSING' && mode === 'KILO' && <section className="mb-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2"><div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-100 text-blue-700"><Scale size={16} /></div><div><p className="text-sm font-extrabold text-blue-950">Poids de la commande</p><p className="text-[11px] text-blue-700">Tarif : {formatFCFA(tarifKilo)} / kg</p></div></div>
            <button type="button" onClick={() => setShowPad(!showPad)} aria-label={showPad ? 'Masquer le pavé numérique' : 'Afficher le pavé numérique'} className="rounded-lg p-2 text-blue-700 hover:bg-blue-100">{showPad ? <ChevronUp size={17} /> : <ChevronDown size={17} />}</button>
          </div>
          <div className="mb-3 flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm">
            <span className="text-3xl font-black tracking-tight text-slate-900">{weightDraft.replace('.', ',')}<span className="ml-1 text-base font-bold text-slate-400">kg</span></span>
            <span className="text-right text-xs font-bold text-slate-400">Montant<br /><b className="text-sm text-blue-700">{formatFCFA(poids * tarifKilo)}</b></span>
          </div>
          {showPad && <div className="grid grid-cols-3 gap-2">
            {['1','2','3','4','5','6','7','8','9','.','0','⌫'].map((digit) => <button key={digit} type="button" onClick={() => digit === '⌫' ? deleteDigit() : enterDigit(digit)} className="min-h-[42px] rounded-xl border border-blue-100 bg-white text-lg font-extrabold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-100 active:scale-95">{digit}</button>)}
          </div>}
        </section>}

        {isForfait && <section className="mb-4 rounded-2xl border border-teal-100 bg-teal-50 p-4">
          <div className="mb-2 flex items-center justify-between"><div><p className="text-sm font-extrabold text-teal-950">Progression du forfait</p><p className="text-xs text-teal-700">{pieces} / {config.nbPiecesRequis} pièces</p></div><span className="rounded-lg bg-white px-2.5 py-1 text-xs font-black text-teal-800">{config.prixTotal.toLocaleString('fr-FR')} F</span></div>
          <div className="h-2.5 overflow-hidden rounded-full bg-teal-100"><div className="h-full rounded-full bg-teal-600 transition-all duration-300" style={{ width: `${progress}%` }} /></div>
          {pieces < config.nbPiecesRequis ? <><p role="status" className="mt-2 flex items-center gap-1.5 text-xs font-bold text-amber-700"><AlertCircle size={14} /> Encore {config.nbPiecesRequis - pieces} pièce{config.nbPiecesRequis - pieces > 1 ? 's' : ''} pour bénéficier du forfait</p><p className="mt-1 text-[10px] text-teal-800">En attendant le seuil, le total est estimé au tarif unitaire.</p></> : <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-teal-800"><Check size={14} /> Forfait débloqué !{pieces > config.nbPiecesRequis ? ` ${pieces - config.nbPiecesRequis} pièce(s) supplémentaire(s) au tarif unitaire.` : ''}</p>}
        </section>}

        {panier.length === 0 ? <div className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-5 text-center"><div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-300 shadow-sm"><ReceiptText size={22} /></div><p className="text-sm font-bold text-slate-600">Votre panier est vide</p><p className="mt-1 text-xs text-slate-400">Touchez les vêtements pour les ajouter</p></div> : <ul className="divide-y divide-slate-100">
          {panier.map((item) => <li key={item.vetement.id} className="flex items-center gap-3 py-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-50"><ClothingIcon item={item.vetement} className="h-8 w-7" /></div>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold text-slate-800">{item.vetement.nom}</p><p className="text-[11px] text-slate-500">{service === 'PRESSING' && mode === 'KILO' ? 'Suivi de pièce' : formatFCFA(item.prixUnitaire ?? 0)} / pièce</p></div>
            <div className="flex items-center gap-2"><button type="button" onClick={() => remove(item.vetement.id)} aria-label={`Retirer un(e) ${item.vetement.nom}`} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100"><Minus size={14} /></button><span className="w-5 text-center text-sm font-black text-slate-800">{item.quantite}</span><button type="button" onClick={() => add(item.vetement)} aria-label={`Ajouter un(e) ${item.vetement.nom}`} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"><Plus size={14} /></button></div>
          </li>)}
        </ul>}
      </div>

      <div className="border-t border-slate-100 bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
        {confirmReset ? <div className="mb-3 rounded-xl border border-rose-100 bg-rose-50 p-3"><p className="mb-2 text-sm font-bold text-rose-800">Vider entièrement ce panier ?</p><div className="flex gap-2"><button type="button" onClick={() => setConfirmReset(false)} className="h-9 flex-1 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600">Garder</button><button type="button" onClick={() => { reset(); setConfirmReset(false); }} className="h-9 flex-1 rounded-lg bg-rose-600 text-xs font-bold text-white">Vider le panier</button></div></div> : null}
        <div className="mb-3 flex items-center justify-between"><span className="text-sm font-bold text-slate-500">Total à payer</span><span className="text-right text-[11px] font-medium text-slate-400">{service === 'PRESSING' && mode === 'KILO' ? `${poids.toLocaleString('fr-FR')} kg × ${tarifKilo.toLocaleString('fr-FR')}` : isForfait && pieces >= config.nbPiecesRequis ? 'Forfait appliqué' : `${pieces} pièce${pieces > 1 ? 's' : ''}`}</span></div>
        <p className={cn('mb-4 text-[28px] font-black leading-none tracking-tight', service === 'PRESSING' ? 'text-blue-700' : 'text-teal-700')}>{formatFCFA(total)}</p>
        <button type="button" disabled={!canValidate || isSaving} onClick={onValidate} className="btn btn-primary h-16 w-full rounded-2xl border-0 bg-blue-600 text-base font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none">
          {isSaving ? <span className="loading loading-spinner loading-sm" /> : <>{isSaving ? 'Enregistrement…' : 'Valider la commande'} <ArrowRight size={18} /></>}
        </button>
        <p className="mt-2 text-center text-[10px] font-medium text-slate-400">{!canValidate && service === 'PRESSING' && mode === 'KILO' ? 'Saisissez le poids pour continuer' : 'La commande sera enregistrée en ligne ou hors connexion'}</p>
      </div>
    </aside>
  );
}
