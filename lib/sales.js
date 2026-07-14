import { supabase } from './supabase';

export async function getSalesInsights() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('sales')
    .select('*, card:cards(name, set_name, image_url_small)')
    .eq('owner_id', user.id)
    .order('sold_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function updateSale(saleId, updates) {
  const { data, error } = await supabase.from('sales').update(updates).eq('id', saleId).select().single();
  if (error) throw error;
  return data;
}

export async function deleteSale(saleId) {
  const { error } = await supabase.from('sales').delete().eq('id', saleId);
  if (error) throw error;
}
