import { useEffect, useState } from 'react';
import { Check, CircleDollarSign, Droplets, Save, Scale, Settings2, Shirt, Sparkles } from 'lucide-react';
import { BLANCHISSERIE_SERVICES, PRESSING_SERVICES, VETEMENTS } from '../data/catalog';
import { useOrderStore } from '../store/useOrderStore';
import type { PrestationBlanchisserie, PrestationPressing, ServiceType } from '../types';
import { cn } from '../lib/utils';
import { ClothingIcon } from '../components/order/ClothingIcon';

function NumberSetting({ value, onCommit, suffix, className = '' }: { value: number; onCommit: (value: number) => void; suffix: string; className?: string }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  return <span className={cn('flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3', className)}><input type="text" inputMode="numeric" value={draft} onChange={(event) => setDraft(event.target.value.replace(/[^0-9]/g, ''))} onBlur={() => { const parsed = Number(draft) || 0; onCommit(parsed); setDraft(String(parsed)); }} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }} className="w-full border-0 p-0 text-right text-sm font-extrabold outline-none focus:ring-0" /><span className="shrink-0 text-xs font-bold text-slate-400">{suffix}</span></span>;
}

export default function SettingsPage() {
  const [service, setService] = useState<ServiceType>('PRESSING');
  const [pressingPrestation, setPressingPrestation] = useState<PrestationPressing>('LAVAGE_REPASSAGE');
  const [laundryPrestation, setLaundryPrestation] = useState<PrestationBlanchisserie>('LAVAGE_SIMPLE');
  const tariffKilo = useOrderStore((state) => state.tarifKilo);
  const forfaits = useOrderStore((state) => state.forfaitConfigs);
  const tarifsPressing = useOrderStore((state) => state.tarifsPressing);
  const tarifsBlanchisserie = useOrderStore((state) => state.tarifsBlanchisserie);
  const setTarifKilo = useOrderStore((state) => state.setTarifKilo);
  const setTarifUnitaire = useOrderStore((state) => state.setTarifUnitaire);
  const setForfaitConfig = useOrderStore((state) => state.setForfaitConfig);
  const prestation = service === 'PRESSING' ? pressingPrestation : laundryPrestation;
  const serviceOptions = service === 'PRESSING' ? PRESSING_SERVICES : BLANCHISSERIE_SERVICES;
  const prices = service === 'PRESSING' ? tarifsPressing[pressingPrestation] : tarifsBlanchisserie[laundryPrestation];
  const currentForfait = forfaits[laundryPrestation];
  const [saved, setSaved] = useState(false);
  const flashSaved = () => { setSaved(true); window.setTimeout(() => setSaved(false), 1500); };
  const saveUnit = (garmentId: string, value: number) => {
    setTarifUnitaire(service, prestation, garmentId, Math.max(0, value));
    flashSaved();
  };

  return <div className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
    <div className="mb-6"><p className="mb-1 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[.15em] text-blue-600"><Settings2 size={14} /> Configuration</p><h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Paramètres & tarifs</h1><p className="mt-1 text-sm text-slate-500">Vos prix sont sauvegardés automatiquement sur cet appareil.</p></div>

    <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-700"><Scale size={20} /></div><div><h2 className="font-extrabold text-slate-900">Tarif de pressing au kilo</h2><p className="mt-1 text-xs text-slate-500">Appliqué au poids, indépendamment du détail des pièces.</p></div></div><NumberSetting value={tariffKilo} onCommit={(value) => { setTarifKilo(value); flashSaved(); }} suffix="FCFA / kg" className="h-12 w-full px-4 sm:max-w-[250px]" /></div></section>

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-5 sm:p-6"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-extrabold text-slate-900">Tarifs à l’unité</h2><p className="mt-1 text-xs text-slate-500">Personnalisez le prix de chaque vêtement pour chaque prestation.</p></div><span className={cn('flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-extrabold transition', saved ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}>{saved ? <Check size={13} /> : <Save size={13} />}{saved ? 'Enregistré' : 'Sauvegarde auto'}</span></div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="flex w-fit rounded-xl bg-slate-100 p-1"><button onClick={() => setService('PRESSING')} className={cn('flex h-10 items-center gap-2 rounded-lg px-4 text-xs font-extrabold', service === 'PRESSING' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500')}><Shirt size={15} /> Pressing</button><button onClick={() => setService('BLANCHISSERIE')} className={cn('flex h-10 items-center gap-2 rounded-lg px-4 text-xs font-extrabold', service === 'BLANCHISSERIE' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500')}><Droplets size={15} /> Blanchisserie</button></div><div className="flex gap-2 overflow-x-auto">{serviceOptions.map((item) => <button key={item.id} onClick={() => service === 'PRESSING' ? setPressingPrestation(item.id as PrestationPressing) : setLaundryPrestation(item.id as PrestationBlanchisserie)} className={cn('h-10 shrink-0 rounded-lg border px-3 text-xs font-bold', item.id === prestation ? service === 'PRESSING' ? 'border-blue-200 bg-blue-50 text-blue-800' : 'border-teal-200 bg-teal-50 text-teal-800' : 'border-slate-200 text-slate-500')}>{item.short}</button>)}</div></div>
    </div>

    {service === 'BLANCHISSERIE' && <div className="grid gap-3 border-b border-slate-100 bg-teal-50/60 p-5 sm:grid-cols-2 sm:p-6"><label><span className="mb-1.5 flex items-center gap-1.5 text-xs font-extrabold text-teal-900"><Sparkles size={14} /> Seuil du forfait ({serviceOptions.find((item) => item.id === laundryPrestation)?.label})</span><NumberSetting value={currentForfait.nbPiecesRequis} onCommit={(value) => { setForfaitConfig(laundryPrestation, { ...currentForfait, nbPiecesRequis: Math.max(1, value) }); flashSaved(); }} suffix="pièces" className="border-teal-100" /></label><label><span className="mb-1.5 flex items-center gap-1.5 text-xs font-extrabold text-teal-900"><CircleDollarSign size={14} /> Prix total du forfait</span><NumberSetting value={currentForfait.prixTotal} onCommit={(value) => { setForfaitConfig(laundryPrestation, { ...currentForfait, prixTotal: Math.max(0, value) }); flashSaved(); }} suffix="FCFA" className="border-teal-100" /></label></div>}

    <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3 xl:grid-cols-4">{VETEMENTS.map((garment) => <label key={garment.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-slate-200 hover:bg-slate-50"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-50"><ClothingIcon item={garment} className="h-7 w-6" /></div><span className="min-w-0 flex-1"><span className="block truncate text-xs font-extrabold text-slate-700">{garment.nom}</span><span className="text-[10px] text-slate-400">Prix par pièce</span></span><NumberSetting key={`${service}-${prestation}-${garment.id}`} value={prices[garment.id] ?? 0} onCommit={(value) => saveUnit(garment.id, value)} suffix="F" className="h-10 w-[112px] rounded-lg px-2" /></label>)}</div>
    </section>
    <p className="mt-4 text-[11px] leading-relaxed text-slate-400">Les modifications sont stockées dans le navigateur de cette tablette. Pour partager les paramètres entre plusieurs appareils, configurez un espace Supabase sécurisé.</p>
  </div>;
}
