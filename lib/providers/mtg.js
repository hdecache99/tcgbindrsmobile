// Scryfall rechaza pedidos sin un User-Agent propio (error 400
// "generic_user_agent") — React Native Android usa OkHttp por debajo y
// manda un User-Agent genérico tipo "okhttp/4.x" si no se lo overridea acá,
// así que TODOS los fetch a Scryfall necesitan estos headers explícitos.
const SCRYFALL_HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'TCGBindrsMobile/1.0 (+https://www.tcgbindrs.com)',
};

export async function searchCards(query) {
  if (!query || query.length < 2) return [];

  const res = await fetch(
    `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&unique=prints&order=released&dir=desc`,
    { headers: SCRYFALL_HEADERS }
  );
  if (!res.ok) return [];

  const json = await res.json();

  return (json.data || []).map((card) => {
    const images = card.image_uris || card.card_faces?.[0]?.image_uris || {};
    return {
      id: `mtg_${card.id}`,
      game: 'mtg',
      name: card.name,
      set_name: card.set_name,
      set_code: card.set?.toUpperCase(),
      number: card.collector_number,
      image_url: images.normal,
      image_url_small: images.small,
      price: card.prices?.usd ? { market: parseFloat(card.prices.usd), currency: 'USD' } : null,
      raw: card,
    };
  });
}

export async function getSets() {
  const res = await fetch('https://api.scryfall.com/sets', { headers: SCRYFALL_HEADERS });
  if (!res.ok) return [];
  const json = await res.json();
  return (json.data || []).map((s) => ({
    // "id" = el código corto (no el UUID interno de Scryfall): getCardsBySet lo usa
    // tal cual en la sintaxis de búsqueda `set:código`, que NO acepta el UUID.
    id: s.code,
    code: s.code,
    name: s.name,
    releaseDate: s.released_at,
    totalCards: s.card_count,
    logoUrl: s.icon_svg_uri,
    game: 'mtg',
  }));
}

export async function getCardsBySet(setCode) {
  return searchCards(`set:${setCode}`);
}
