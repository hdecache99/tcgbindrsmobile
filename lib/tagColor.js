// Color determinístico por etiqueta (sin guardar nada nuevo en la base de
// datos): el mismo texto de etiqueta siempre cae en el mismo color, tanto
// en el filtro de "Marcadores" como en el punto de color sobre la carta.
const PALETTE = ['#7A3B9A', '#d97706', '#059669', '#2563eb', '#db2777', '#0891b2', '#ca8a04', '#dc2626'];

export function getTagColor(tag) {
  if (!tag) return null;
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = (hash * 31 + tag.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}
