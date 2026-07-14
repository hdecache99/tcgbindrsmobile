import { supabase } from './supabase';

export async function getLatestNews(limit = 30) {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching news:', error.message);
    return [];
  }

  return data ?? [];
}
