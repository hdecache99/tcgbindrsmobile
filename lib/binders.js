import { supabase } from './supabase';
import { logActivity } from './activity';

const COUNT_AND_PREVIEWS = 'card_count:binder_cards(count), previews:binder_cards(card:cards(image_url_small))';

function normalizeBinder(binder) {
  return {
    ...binder,
    card_count: binder.card_count?.[0]?.count || 0,
    previews: (binder.previews || []).slice(0, 5),
  };
}

export async function getUserBinders() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('binders')
    .select(`*, ${COUNT_AND_PREVIEWS}`)
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(normalizeBinder);
}

export async function createBinder({ title, description, visibility }) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('binders')
    .insert({
      owner_id: user.id,
      title: title.trim(),
      description: description?.trim() || null,
      visibility: visibility || 'private',
      cards_per_page: 4,
    })
    .select()
    .single();

  if (error) throw error;

  logActivity('create_binder', { binder_id: data.id, binder_title: data.title }).catch(() => {});

  return data;
}

// Update genérico (igual que updateBinderCard) — deja que cada pantalla mande
// solo los campos que le interesan (título/visibilidad, tamaño de grid, color
// de tema, marcadores...) sin tener que enumerar todos los props aquí.
export async function updateBinder(binderId, updates) {
  const { data, error } = await supabase.from('binders').update(updates).eq('id', binderId).select().single();

  if (error) throw error;
  return data;
}

export async function deleteBinder(binderId) {
  const { error } = await supabase.from('binders').delete().eq('id', binderId);
  if (error) throw error;
}

export async function getBinder(binderId) {
  const { data, error } = await supabase
    .from('binders')
    .select('*, owner:profiles(id, username, display_name, avatar_url, whatsapp_e164, currency)')
    .eq('id', binderId)
    .single();

  if (error) throw error;
  return data;
}

export async function getBinderCards(binderId) {
  const { data, error } = await supabase
    .from('binder_cards')
    .select('*, card:cards(*)')
    .eq('binder_id', binderId)
    .order('position', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getPublicBindersByUsername(username) {
  const { data: owner, error: ownerError } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, banner_color, plan, whatsapp_e164')
    .eq('username', username)
    .single();

  if (ownerError) throw ownerError;

  const { data, error } = await supabase
    .from('binders')
    .select(`*, ${COUNT_AND_PREVIEWS}`)
    .eq('owner_id', owner.id)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return { owner, binders: data.map(normalizeBinder) };
}

export async function getPublicBinders(limit = 20) {
  const { data, error } = await supabase
    .from('binders')
    .select(`*, owner:profiles(id, username, display_name, avatar_url), ${COUNT_AND_PREVIEWS}`)
    .eq('visibility', 'public')
    .order('view_count', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data.map(normalizeBinder);
}
