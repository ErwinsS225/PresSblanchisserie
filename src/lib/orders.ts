import { createClient } from '@supabase/supabase-js';
import type { OrderRecord } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
const QUEUE_KEY = 'pressblanchisserie:pending-orders';

function queueOffline(order: OrderRecord) {
  const current: OrderRecord[] = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]') as OrderRecord[];
  localStorage.setItem(QUEUE_KEY, JSON.stringify([...current, order]));
}

/** Enregistre le ticket dans Supabase si possible, sinon dans la file locale hors-ligne. */
export async function saveOrder(order: OrderRecord): Promise<'synced' | 'pending'> {
  if (navigator.onLine && supabase) {
    const { error } = await supabase.from('orders').insert({
      id: order.id,
      created_at: order.created_at,
      service: order.service,
      prestation: order.prestation,
      mode: order.mode,
      poids_kg: order.poids_kg,
      items: order.items,
      total_fcfa: order.total_fcfa,
      sync_status: 'synced'
    });
    if (!error) return 'synced';
  }
  queueOffline({ ...order, sync_status: 'pending' });
  return 'pending';
}

/** Synchronise les tickets conservés localement dès que la connexion revient. */
export async function syncPendingOrders() {
  if (!navigator.onLine || !supabase) return 0;
  const pending = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]') as OrderRecord[];
  if (!pending.length) return 0;
  const { error } = await supabase.from('orders').upsert(pending.map((order) => ({ ...order, sync_status: 'synced' })));
  if (error) return 0;
  localStorage.removeItem(QUEUE_KEY);
  return pending.length;
}

export function pendingOrderCount() {
  try { return (JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]') as OrderRecord[]).length; }
  catch { return 0; }
}
