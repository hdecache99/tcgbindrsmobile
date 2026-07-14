export async function searchCards(query) {
  if (!query || query.length < 2) return [];

  const res = await fetch(`https://api.lorcast.com/v0/cards/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) return [];

  const json = await res.json();

  return (json.results || []).slice(0, 50).map((card) => ({
    id: `lor_${card.id}`,
    game: 'lorcana',
    name: card.version ? `${card.name} (${card.version})` : card.name,
    set_name: card.set?.name,
    set_code: card.set?.id?.toUpperCase(),
    number: card.collector_number,
    image_url: card.image_uris?.digital?.normal,
    image_url_small: card.image_uris?.digital?.small,
    price: card.prices?.usd ? { market: parseFloat(card.prices.usd), currency: 'USD' } : null,
    raw: card,
  }));
}

export async function getSets() {
  const res = await fetch('https://api.lorcast.com/v0/sets');
  if (!res.ok) return [];
  const json = await res.json();
  const list = json.results || json.data || (Array.isArray(json) ? json : []);
  return list.map((s) => ({
    // "id" = el código corto ("P1", "TFC"...), no el id interno de Lorcast:
    // getCardsBySet lo usa tal cual en `set:código` y el id interno da 0 resultados.
    id: s.code,
    code: s.code,
    name: s.name,
    releaseDate: s.released_at,
    totalCards: s.card_count,
    game: 'lorcana',
  }));
}

export async function getCardsBySet(setCode) {
  return searchCards(`set:${setCode}`);
}
