// Mismo comportamiento que la web (src/lib/currency.ts): tasas fijas de
// referencia, no una API en vivo — mantiene los números consistentes entre
// ambas plataformas ya que comparten el mismo Supabase.
export const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  MXN: '$',
  CRC: '₡',
};

const EXCHANGE_RATES = {
  USD: 1,
  EUR: 0.92,
  MXN: 18.5,
  CRC: 515,
};

export function formatPrice(price, currency = 'USD') {
  if (price === null || price === undefined) return '';
  const symbol = CURRENCY_SYMBOLS[currency] || '$';

  if (currency === 'CRC') {
    // Los colones normalmente no muestran decimales para cartas TCG.
    return `${symbol}${Math.round(price).toLocaleString('es-CR')}`;
  }

  return `${symbol}${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function convertPrice(price, from, to) {
  if (price === null || price === undefined) return null;
  if (from === to) return price;

  const usdPrice = price / EXCHANGE_RATES[from];
  return usdPrice * EXCHANGE_RATES[to];
}

export function getCurrencySymbol(currency = 'USD') {
  return CURRENCY_SYMBOLS[currency] || '$';
}
