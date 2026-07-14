function mapCard(card) {
  return {
    // optcgapi no siempre trae card_number; si falta, generamos un id local
    // (no persiste entre búsquedas, pero sirve para la key de la lista y el insert único).
    id: `op_${card.card_number || Math.random().toString(36).slice(2)}`,
    game: 'onepiece',
    name: card.card_name,
    set_name: card.set_name,
    set_code: card.set_id,
    number: card.card_number,
    image_url: card.card_image,
    image_url_small: card.card_image,
    price: card.market_price ? { market: parseFloat(card.market_price), currency: 'USD' } : null,
    raw: card,
  };
}

export async function searchCards(query) {
  if (!query || query.length < 2) return [];

  const res = await fetch(`https://www.optcgapi.com/api/sets/filtered/?card_name=${encodeURIComponent(query)}`);
  if (!res.ok) return [];

  const json = await res.json();
  return (Array.isArray(json) ? json : []).slice(0, 50).map(mapCard);
}

export async function getSets() {
  const res = await fetch('https://www.optcgapi.com/api/allSets/');
  if (!res.ok) return [];
  const json = await res.json();
  return (Array.isArray(json) ? json : []).map((s) => ({
    id: s.set_id,
    code: s.set_id,
    name: s.set_name,
    game: 'onepiece',
  }));
}

export async function getCardsBySet(setCode) {
  const res = await fetch(`https://www.optcgapi.com/api/sets/filtered/?set_id=${encodeURIComponent(setCode)}`);
  if (!res.ok) return [];
  const json = await res.json();
  return (Array.isArray(json) ? json : []).slice(0, 200).map(mapCard);
}
