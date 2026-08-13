import { supabase } from './supabase';
import { getProfile } from './profile';
import { markCardAsSold } from './binderCards';

// Pide la cantidad completa disponible de cada binder_card seleccionada —
// no hay stepper para pedir una parte, el dueño igual puede rechazar.
export async function createOrder(binder, selectedCards) {
  const profile = await getProfile();

  const items = selectedCards.map((c) => ({
    binder_card_id: c.id,
    card_id: c.card_id,
    card_name: c.card?.name ?? null,
    quantity: c.quantity ?? 1,
    ask_price: c.ask_price ?? null,
  }));

  const { data, error } = await supabase
    .from('binder_orders')
    .insert({
      binder_id: binder.id,
      binder_title: binder.title,
      owner_id: binder.owner_id,
      buyer_id: profile.id,
      buyer_username: profile.username,
      items,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Solo el conteo — usado para la burbuja del botón "Pedidos" sin traer filas de más.
export async function getPendingOrderCount(binderId) {
  const { count, error } = await supabase
    .from('binder_orders')
    .select('*', { count: 'exact', head: true })
    .eq('binder_id', binderId)
    .eq('status', 'pending');

  if (error) throw error;
  return count || 0;
}

export async function getPendingOrders(binderId) {
  const { data, error } = await supabase
    .from('binder_orders')
    .select('*')
    .eq('binder_id', binderId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Igual que las de arriba pero sin filtrar por binder — para la bandeja
// global (pantalla "Pedidos" del menú), que junta los pedidos pendientes de
// TODOS los binders del usuario logueado (dueño).
export async function getAllPendingOrders() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('binder_orders')
    .select('*')
    .eq('owner_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getAllPendingOrderCount() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { count, error } = await supabase
    .from('binder_orders')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', user.id)
    .eq('status', 'pending');

  if (error) throw error;
  return count || 0;
}

// Por cada item se relee la binder_card actual (precio/cantidad pueden haber
// cambiado desde que se hizo el pedido) y se reutiliza markCardAsSold, que ya
// clampa la cantidad y registra la venta. Si la carta ya no existe (se vendió
// o se borró por otro lado mientras el pedido estaba pendiente), se salta.
export async function acceptOrder(order, currency) {
  for (const item of order.items) {
    const { data: binderCard } = await supabase
      .from('binder_cards')
      .select('*, card:cards(*)')
      .eq('id', item.binder_card_id)
      .maybeSingle();

    if (!binderCard) continue;

    const soldQty = Math.min(item.quantity ?? 1, binderCard.quantity ?? 1);
    await markCardAsSold(binderCard, binderCard.ask_price ?? 0, currency, soldQty);
  }

  const { error } = await supabase
    .from('binder_orders')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', order.id);

  if (error) throw error;
}

export async function rejectOrder(orderId) {
  const { error } = await supabase
    .from('binder_orders')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', orderId);

  if (error) throw error;
}
