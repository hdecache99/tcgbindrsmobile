import { supabase } from './supabase';
import { convertPrice } from './currency';
import { logActivity } from './activity';

export async function addCardToBinder(binderId, card, quantity = 1, currency = 'USD') {
  // 1) Guarda la carta en el catálogo compartido (idempotente: si ya existe, no la duplica).
  const { error: cardError } = await supabase
    .from('cards')
    .upsert(
      {
        id: card.id,
        game: card.game,
        name: card.name,
        set_name: card.set_name,
        set_code: card.set_code,
        number: card.number,
        image_url: card.image_url,
        image_url_small: card.image_url_small,
        raw: card.raw,
      },
      { onConflict: 'id', ignoreDuplicates: true }
    );
  if (cardError) throw cardError;

  // 2) La coloca al final del binder (posición = máxima actual + 1).
  const { data: last } = await supabase
    .from('binder_cards')
    .select('position')
    .eq('binder_id', binderId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextPosition = (last?.position ?? 0) + 1;

  const { data, error } = await supabase
    .from('binder_cards')
    .insert({
      binder_id: binderId,
      card_id: card.id,
      language: 'EN',
      condition: 'NM',
      finish: 'normal',
      quantity,
      status: 'collection',
      // El precio de mercado viene siempre en USD de las APIs externas; se
      // convierte una sola vez a la moneda del dueño al guardarlo (igual que
      // la web) — así `ask_price` queda listo para mostrarse sin reconvertir.
      ask_price: convertPrice(card.price?.market ?? null, 'USD', currency),
      position: nextPosition,
    })
    .select('*, card:cards(*)')
    .single();

  if (error) throw error;

  // No bloquea el guardado de la carta si falla — el feed de actividad es
  // secundario, la carta ya quedó agregada.
  logActivity('add_card', { count: quantity, first_card: card.name, binder_id: binderId }).catch(() => {});

  return data;
}

export async function updateBinderCard(binderCardId, updates) {
  const { data, error } = await supabase
    .from('binder_cards')
    .update(updates)
    .eq('id', binderCardId)
    .select('*, card:cards(*)')
    .single();

  if (error) throw error;
  return data;
}

// Recibe las binder_cards ya en el nuevo orden (tras un drag-and-drop) y persiste
// `position` = índice+1 para cada una que haya cambiado respecto a su posición actual.
export async function reorderBinderCards(orderedCards) {
  const updates = orderedCards
    .map((item, index) => ({ id: item.id, position: index + 1 }))
    .filter((item, index) => orderedCards[index].position !== item.position);

  await Promise.all(
    updates.map(({ id, position }) =>
      supabase.from('binder_cards').update({ position }).eq('id', id)
    )
  );
}

export async function removeCardFromBinder(binderCardId) {
  const { error } = await supabase.from('binder_cards').delete().eq('id', binderCardId);
  if (error) throw error;
}

// Igual que la web: vender una carta no solo cambia su estado, la saca del binder
// y queda registrada en tu historial de ventas (tabla `sales`). Si había más de
// una copia y solo se vendió parte (soldQuantity < binderCard.quantity), las
// copias restantes se quedan en el binder en vez de borrar la carta entera.
export async function markCardAsSold(binderCard, salePrice, currency = 'USD', soldQuantity) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const totalQuantity = binderCard.quantity ?? 1;
  const soldQty = Math.max(1, Math.min(soldQuantity ?? totalQuantity, totalQuantity));

  const { error: saleError } = await supabase.from('sales').insert({
    owner_id: user.id,
    card_id: binderCard.card_id,
    sale_price: salePrice ?? 0,
    currency,
    quantity: soldQty,
    condition: binderCard.condition,
    finish: binderCard.finish,
    language: binderCard.language,
  });

  if (saleError) throw saleError;

  if (soldQty >= totalQuantity) {
    await removeCardFromBinder(binderCard.id);
  } else {
    const { error } = await supabase
      .from('binder_cards')
      .update({ quantity: totalQuantity - soldQty })
      .eq('id', binderCard.id);
    if (error) throw error;
  }
}
