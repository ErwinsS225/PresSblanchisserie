import type { TypeVetement } from '../../types';

const silhouettes: Record<string, string> = {
  shirt: 'M13 6l3 2 4-2 5 4-3 5-3-2v13H5V13l-3 2-3-5 5-4 4 2 3-2z',
  polo: 'M13 6l3 2 4-2 5 4-3 5-3-2v13H5V13l-3 2-3-5 5-4 4 2 3-2z',
  tee: 'M13 6l3 2 4-2 5 5-4 4-3-2v13H5V13l-3 2-4-4 5-5 4 2 3-2z',
  jacket: 'M9 5l4 2 4-2 5 4-2 18H6L4 9l5-4zm4 2v20M8 11l3 2-3 3m10-5-3 2 3 3',
  trousers: 'M6 5h14l-1 22h-5l-1-12-1 12H7L6 5z',
  jeans: 'M6 5h14l-1 22h-5l-1-12-1 12H7L6 5zm1 5h12',
  skirt: 'M8 5h10l4 22H4L8 5zm1 5h8',
  dress: 'M9 5h8l2 6 5 16H3l5-16 1-6zm1 6h6',
  boubou: 'M8 5h10l2 5 6 17H2l6-17 0-5zm5 0v22',
  sheet: 'M4 8c0-2 2-4 5-4h9c3 0 5 2 5 4v17H4V8zm0 3h19M8 11v14',
  towel: 'M6 4h14v22H6zM9 8h8M9 12h8M9 16h8M9 20h8',
  curtain: 'M5 4h16v23H5zM9 4v23m8-23v23M3 4h20'
};

export function ClothingIcon({ item, className = '' }: { item: TypeVetement; className?: string }) {
  const path = silhouettes[item.icone] ?? silhouettes.shirt;
  return (
    <svg aria-hidden="true" viewBox="0 0 26 32" className={className} fill="none">
      <path d={path} fill={item.categorie === 'LITERIE' ? '#d7f2eb' : '#dbeafe'} stroke="#40546b" strokeWidth="1.35" strokeLinejoin="round" strokeLinecap="round" />
      {item.icone === 'polo' && <path d="M11 8l2 4 2-4m-2 4v5" stroke="#40546b" strokeWidth="1" strokeLinecap="round" />}
      {(item.icone === 'shirt' || item.icone === 'jacket') && <path d="M13 8v18" stroke="#7890a8" strokeWidth=".8" strokeDasharray="1.4 1.5" />}
    </svg>
  );
}
