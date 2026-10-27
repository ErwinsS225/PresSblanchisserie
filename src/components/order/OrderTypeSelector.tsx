import { Check, Droplets, Scale, Shirt, Sparkles, Tag } from 'lucide-react';
import { PRESSING_SERVICES, BLANCHISSERIE_SERVICES } from '../../data/catalog';
import { useOrderStore } from '../../store/useOrderStore';
import { cn } from '../../lib/utils';
import { Switch } from '../ui/switch';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';

export default function OrderTypeSelector() {
  const service = useOrderStore((state) => state.serviceActif);
  const mode = useOrderStore((state) => state.modeFacturation);
  const pressingPrestation = useOrderStore((state) => state.prestationPressing);
  const laundryPrestation = useOrderStore((state) => state.prestationBlanchisserie);
  const setService = useOrderStore((state) => state.setService);
  const setMode = useOrderStore((state) => state.setModeFacturation);
  const setPressingPrestation = useOrderStore((state) => state.setPrestationPressing);
  const setLaundryPrestation = useOrderStore((state) => state.setPrestationBlanchisserie);
  const forfaitConfig = useOrderStore((state) => state.forfaitConfigs[state.prestationBlanchisserie]);
  const pressing = service === 'PRESSING';

  return (
    <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:gap-6">
        <div className="xl:w-[245px] xl:shrink-0">
          <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[.14em] text-slate-400">Type de service</p>
          <Tabs value={service} onValueChange={(value) => setService(value as 'PRESSING' | 'BLANCHISSERIE')}>
            <TabsList className="grid h-[58px] w-full grid-cols-2 rounded-xl bg-slate-100 p-1">
              <TabsTrigger value="PRESSING" className={cn('flex items-center justify-center gap-2 rounded-lg text-sm font-extrabold', service === 'PRESSING' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500')}><Shirt size={16} /> Pressing</TabsTrigger>
              <TabsTrigger value="BLANCHISSERIE" className={cn('flex items-center justify-center gap-2 rounded-lg text-sm font-extrabold', service === 'BLANCHISSERIE' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500')}><Droplets size={16} /> Blanchisserie</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-[11px] font-extrabold uppercase tracking-[.14em] text-slate-400">{pressing ? 'Prestation & facturation' : 'Prestation blanchisserie'}</p>
            {pressing ? <div className="flex rounded-lg bg-slate-100 p-1" aria-label="Mode de facturation">
              <button type="button" onClick={() => setMode('KILO')} className={cn('flex h-9 items-center gap-1.5 rounded-md px-3 text-xs font-bold transition', mode === 'KILO' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500')}><Scale size={14} /> Au kilo</button>
              <button type="button" onClick={() => setMode('UNITE')} className={cn('flex h-9 items-center gap-1.5 rounded-md px-3 text-xs font-bold transition', mode === 'UNITE' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500')}><Tag size={14} /> À l’unité</button>
            </div> : <div className="flex items-center gap-2 rounded-lg bg-teal-50 px-3 py-2 text-xs font-bold text-teal-800">
              <span>{mode === 'FORFAIT' ? 'Forfait' : 'À l’unité'}</span>
              <Switch checked={mode === 'FORFAIT'} onCheckedChange={(checked) => setMode(checked ? 'FORFAIT' : 'UNITE')} aria-label="Activer le mode forfait" />
              <span className="hidden sm:inline">{forfaitConfig.nbPiecesRequis} pièces · {forfaitConfig.prixTotal.toLocaleString('fr-FR')} F</span>
            </div>}
          </div>

          <div className="flex flex-wrap gap-2">
            {(pressing ? PRESSING_SERVICES : BLANCHISSERIE_SERVICES).map((prestation) => {
              const active = pressing ? pressingPrestation === prestation.id : laundryPrestation === prestation.id;
              return <button key={prestation.id} type="button" onClick={() => pressing ? setPressingPrestation(prestation.id as typeof pressingPrestation) : setLaundryPrestation(prestation.id as typeof laundryPrestation)} className={cn('flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all active:scale-[.98] sm:text-sm', active ? pressing ? 'border-blue-200 bg-blue-50 text-blue-800 ring-1 ring-blue-100' : 'border-teal-200 bg-teal-50 text-teal-800 ring-1 ring-teal-100' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50')}>
                {active && <Check size={14} className={pressing ? 'text-blue-600' : 'text-teal-600'} />}{prestation.label}
              </button>;
            })}
          </div>
          <p className={cn('mt-3 flex items-center gap-1.5 text-xs font-medium', pressing ? 'text-blue-700' : 'text-teal-700')}>
            <Sparkles size={13} /> {pressing ? mode === 'KILO' ? '1 600 FCFA / kg · les vêtements sont suivis sans changer le prix.' : 'Le prix dépend du vêtement et de la prestation.' : mode === 'FORFAIT' ? `Forfait ${forfaitConfig.nbPiecesRequis} pièces : ${forfaitConfig.prixTotal.toLocaleString('fr-FR')} FCFA.` : 'Chaque pièce est facturée selon le vêtement et la prestation.'}
          </p>
        </div>
      </div>
    </div>
  );
}
