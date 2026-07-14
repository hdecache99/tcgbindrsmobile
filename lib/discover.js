import { supabase } from './supabase';

// Busca una carta por nombre entre TODOS los binders públicos de la comunidad
// (no solo los tuyos) — para cuando alguien quiere saber quién tiene tal carta.
export async function searchCardInCommunity(query) {
  if (!query || query.trim().length < 2) return [];

  const { data, error } = await supabase
    .from('binder_cards')
    .select(
      'id, status, ask_price, card:cards!inner(name, image_url_small, set_name), binder:binders!inner(id, title, owner:profiles(username, display_name))'
    )
    .eq('binder.visibility', 'public')
    .ilike('card.name', `%${query.trim()}%`)
    .limit(30);

  if (error) throw error;
  return data;
}

export async function searchUsers(query) {
  if (!query || query.trim().length < 2) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name')
    .ilike('username', `%${query.trim()}%`)
    .limit(20);

  if (error) throw error;
  return data;
}
