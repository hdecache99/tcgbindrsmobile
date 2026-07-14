import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { formatPrice } from './currency';

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function slugify(str) {
  return (
    String(str ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'binder'
  );
}

export async function exportBinderPdf(binder, cards, currency) {
  const cardsHtml = cards
    .map((bc) => {
      const card = bc.card;
      const price = bc.ask_price != null ? formatPrice(Number(bc.ask_price), currency) : '';
      return `
        <div class="cell">
          ${card?.image_url_small ? `<img src="${card.image_url_small}" />` : '<div class="placeholder"></div>'}
          <div class="name">${escapeHtml(card?.name)}</div>
          ${price ? `<div class="price">${price}</div>` : ''}
        </div>
      `;
    })
    .join('');

  const html = `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, Helvetica, Arial, sans-serif; padding: 16px; }
          h1 { font-size: 18px; margin-bottom: 4px; }
          .meta { color: #666; font-size: 11px; margin-bottom: 16px; }
          .grid { display: flex; flex-wrap: wrap; gap: 8px; }
          .cell { width: 100px; text-align: center; page-break-inside: avoid; margin-bottom: 8px; }
          .cell img { width: 100%; border-radius: 4px; }
          .placeholder { width: 100%; aspect-ratio: 63/88; background: #eee; border-radius: 4px; }
          .name { font-size: 9px; margin-top: 4px; }
          .price { font-size: 9px; font-weight: bold; color: #7A3B9A; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(binder.title)}</h1>
        <div class="meta">${cards.length} carta(s) — generado por TCGBINDR</div>
        <div class="grid">${cardsHtml}</div>
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `${binder.title}.pdf` });
}

function csvEscape(value) {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export async function exportBinderCsv(binder, cards) {
  const header = ['Nombre', 'Expansión', 'Número', 'Condición', 'Idioma', 'Cantidad', 'Estado', 'Precio'];
  const rows = cards.map((bc) => [
    bc.card?.name,
    bc.card?.set_name,
    bc.card?.number,
    bc.condition,
    bc.language,
    bc.quantity ?? 1,
    bc.status,
    bc.ask_price != null ? Number(bc.ask_price).toFixed(2) : '',
  ]);

  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');

  const file = new File(Paths.cache, `${slugify(binder.title)}.csv`);
  file.create({ overwrite: true });
  file.write(csv);

  await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: `${binder.title}.csv` });
}
