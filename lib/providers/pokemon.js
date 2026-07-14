import { supabase } from '../supabase';

const API_KEY = process.env.EXPO_PUBLIC_POKEMON_TCG_API_KEY;

function mapCachedCard(card) {
  const market = card.price_holofoil || card.price_normal || card.price_reverse;
  return {
    id: `pkm_${card.id}`,
    game: 'pokemon',
    name: card.name,
    set_name: card.set_name,
    set_code: card.set_id,
    set_icon_url: card.set_symbol_url || null,
    number: card.number,
    image_url: card.image_large,
    image_url_small: card.image_small,
    price: market ? { market: Number(market), currency: 'USD' } : null,
    raw: card,
  };
}

function mapApiCard(card) {
  const market = card.tcgplayer?.prices?.holofoil?.market || card.tcgplayer?.prices?.normal?.market || null;
  return {
    id: `pkm_${card.id}`,
    game: 'pokemon',
    name: card.name,
    set_name: card.set?.name,
    set_code: card.set?.id,
    set_icon_url: card.set?.images?.symbol || null,
    number: card.number,
    image_url: card.images?.large,
    image_url_small: card.images?.small,
    price: market ? { market, currency: 'USD' } : null,
    raw: card,
  };
}

export async function searchCards(query) {
  if (!query || query.length < 2) return [];

  // 1) Primero la caché local en Supabase (rápida, sin límites de la API pública).
  const { data: cached } = await supabase
    .from('pokemon_cards')
    .select('*')
    .ilike('name', `%${query}%`)
    .order('name')
    .limit(50);

  if (cached?.length) return cached.map(mapCachedCard);

  // 2) Si la caché no tiene resultados (ej. el cron de sync de la web todavía no
  // corrió, o esta carta no está sincronizada aún), pega directo a la API pública.
  try {
    const res = await fetch(
      `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(`name:"${query}*"`)}&pageSize=50`,
      { headers: API_KEY ? { 'X-Api-Key': API_KEY } : {} }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data || []).map(mapApiCard);
  } catch {
    return [];
  }
}

export async function getSets() {
  const { data: cached } = await supabase.from('pokemon_sets').select('*').order('release_date', { ascending: false });

  if (cached?.length) {
    return cached.map((s) => ({
      id: s.id,
      code: s.id,
      name: s.name,
      releaseDate: s.release_date,
      totalCards: s.total_cards || 0,
      logoUrl: s.logo_url,
      game: 'pokemon',
    }));
  }

  try {
    const res = await fetch('https://api.pokemontcg.io/v2/sets', {
      headers: API_KEY ? { 'X-Api-Key': API_KEY } : {},
    });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data || []).map((s) => ({
      id: s.id,
      code: s.id,
      name: s.name,
      releaseDate: s.releaseDate,
      totalCards: s.total,
      logoUrl: s.images?.logo,
      game: 'pokemon',
    }));
  } catch {
    return [];
  }
}

export async function getCardsBySet(setId) {
  const { data: cached } = await supabase.from('pokemon_cards').select('*').eq('set_id', setId).order('number');
  if (cached?.length) return cached.map(mapCachedCard);

  try {
    const res = await fetch(
      `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(`set.id:${setId}`)}&pageSize=250`,
      { headers: API_KEY ? { 'X-Api-Key': API_KEY } : {} }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data || []).map(mapApiCard);
  } catch {
    return [];
  }
}
