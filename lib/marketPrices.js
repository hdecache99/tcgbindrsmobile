import { supabase } from './supabase';

export async function getMarketPrice(cardId) {
  const { data } = await supabase.from('market_prices').select('*').eq('card_id', cardId).maybeSingle();
  return data;
}

// Respaldo para cuando `market_prices` (la tabla que la web sincroniza por su
// cuenta con un cron) todavía no tiene esta carta en caché — muy común en
// cartas agregadas desde mobile. En vez de pegarle de nuevo a la API externa,
// reconstruye el precio a partir del `raw` que ya se guardó en `cards.raw` al
// momento de agregar la carta (mismo campo que usa cada provider en
// lib/providers/* para calcular `price.market` la primera vez).
export function deriveMarketPriceFromRaw(game, raw) {
  if (!raw) return null;

  switch (game) {
    case 'mtg':
    case 'lorcana':
      return raw.prices?.usd ? parseFloat(raw.prices.usd) : null;
    case 'pokemon':
      return (
        raw.tcgplayer?.prices?.holofoil?.market ??
        raw.tcgplayer?.prices?.normal?.market ??
        raw.price_holofoil ??
        raw.price_normal ??
        raw.price_reverse ??
        null
      );
    case 'onepiece':
      return raw.market_price ? parseFloat(raw.market_price) : null;
    case 'ygo': {
      const price = raw.card_prices?.[0];
      const market = price ? parseFloat(price.tcgplayer_price || price.cardmarket_price || 0) : 0;
      return market || null;
    }
    default:
      // digimon: la API pública no expone precios, así que no hay nada que derivar.
      return null;
  }
}
