function mapCard(card) {
  const set = card.card_sets?.[0];
  const price = card.card_prices?.[0];
  const market = price ? parseFloat(price.tcgplayer_price || price.cardmarket_price || 0) : 0;
  return {
    id: `ygo_${card.id}`,
    game: 'ygo',
    name: card.name,
    set_name: set?.set_name || null,
    set_code: set?.set_code || null,
    number: null,
    image_url: card.card_images?.[0]?.image_url,
    image_url_small: card.card_images?.[0]?.image_url_small,
    price: market ? { market, currency: 'USD' } : null,
    raw: card,
  };
}

export async function searchCards(query) {
  if (!query || query.length < 2) return [];

  const res = await fetch(
    `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(query)}&num=20&offset=0`
  );
  if (!res.ok) return [];

  const json = await res.json();
  return (json.data || []).map(mapCard);
}

export async function getSets() {
  const res = await fetch('https://db.ygoprodeck.com/api/v7/cardsets.php');
  if (!res.ok) return [];
  const json = await res.json();
  return (json || []).map((s) => ({
    id: s.set_name,
    code: s.set_code,
    name: s.set_name,
    totalCards: s.num_of_cards,
    releaseDate: s.tcg_date,
    game: 'ygo',
  }));
}

export async function getCardsBySet(setName) {
  const res = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?set=${encodeURIComponent(setName)}`);
  if (!res.ok) return [];
  const json = await res.json();
  return (json.data || []).map(mapCard);
}
