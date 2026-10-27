import { createClient } from '@supabase/supabase-js';
import type { OrderRecord, OrderStatus } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
const QUEUE_KEY = 'pressblanchisserie:pending-orders';
const HISTORY_KEY = 'pressblanchisserie:order-history';

export function getLocalOrders(): OrderRecord[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]') as OrderRecord[]; }
  catch { return []; }
}

function saveLocalOrders(orders: OrderRecord[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(orders));
}

function upsertLocalOrder(order: OrderRecord) {
  const orders = getLocalOrders();
  const index = orders.findIndex((item) => item.id === order.id);
  if (index < 0) orders.unshift(order);
  else orders[index] = { ...orders[index], ...order };
  saveLocalOrders(orders);
}

function queueOffline(order: OrderRecord) {
  const current: OrderRecord[] = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]') as OrderRecord[];
  const index = current.findIndex((item) => item.id === order.id);
  if (index < 0) current.push(order);
  else current[index] = order;
  localStorage.setItem(QUEUE_KEY, JSON.stringify(current));
}

const toDatabaseRow = (order: OrderRecord) => ({
  id: order.id,
  created_at: order.created_at,
  service: order.service,
  prestation: order.prestation,
  mode: order.mode,
  poids_kg: order.poids_kg,
  items: order.items,
  total_fcfa: order.total_fcfa,
  sync_status: order.sync_status,
  client_nom: order.client_nom ?? null,
  client_telephone: order.client_telephone ?? null,
  montant_paye: order.montant_paye ?? 0,
  moyen_paiement: order.moyen_paiement ?? 'NON_PAYE',
  statut: order.statut ?? 'RECU'
});

/** Toujours conserve le ticket localement ; Supabase est utilisé dès qu'il est configuré et joignable. */
export async function saveOrder(order: OrderRecord): Promise<'synced' | 'pending'> {
  const local = { ...order, sync_status: 'pending' as const };
  upsertLocalOrder(local);
  if (navigator.onLine && supabase) {
    const { error } = await supabase.from('orders').upsert({ ...toDatabaseRow(order), sync_status: 'synced' });
    if (!error) {
      upsertLocalOrder({ ...order, sync_status: 'synced' });
      return 'synced';
    }
  }
  queueOffline(local);
  return 'pending';
}

/** Synchronise tickets et changements d'état conservés localement au retour du réseau. */
export async function syncPendingOrders() {
  if (!navigator.onLine || !supabase) return 0;
  const pending = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]') as OrderRecord[];
  if (!pending.length) return 0;
  const { error } = await supabase.from('orders').upsert(pending.map((order) => ({ ...toDatabaseRow(order), sync_status: 'synced' })));
  if (error) return 0;
  pending.forEach((order) => upsertLocalOrder({ ...order, sync_status: 'synced' }));
  localStorage.removeItem(QUEUE_KEY);
  return pending.length;
}

export async function listOrders(): Promise<OrderRecord[]> {
  if (navigator.onLine && supabase) {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      const remote = data as OrderRecord[];
      const local = getLocalOrders();
      const merged = new Map([...remote, ...local].map((item) => [item.id, item]));
      const orders = [...merged.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));
      saveLocalOrders(orders);
      return orders;
    }
  }
  return getLocalOrders().sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function setOrderStatus(id: string, statut: OrderStatus): Promise<'synced' | 'pending'> {
  const order = getLocalOrders().find((item) => item.id === id);
  if (!order) return 'pending';
  const updated = { ...order, statut, sync_status: 'pending' as const };
  upsertLocalOrder(updated);
  if (navigator.onLine && supabase) {
    const { error } = await supabase.from('orders').update({ statut, sync_status: 'synced' }).eq('id', id);
    if (!error) {
      upsertLocalOrder({ ...updated, sync_status: 'synced' });
      return 'synced';
    }
  }
  queueOffline(updated);
  return 'pending';
}

export function pendingOrderCount() {
  try { return (JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]') as OrderRecord[]).length; }
  catch { return 0; }
}
