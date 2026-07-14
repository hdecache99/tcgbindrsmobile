export const STATUS_LABEL = {
  collection: 'Colección',
  trade: 'Trade',
  sale: 'Venta',
};

export const STATUS_COLOR = {
  collection: { color: '#7A3B9A', backgroundColor: 'rgba(122, 59, 154, 0.12)' },
  trade: { color: '#d97706', backgroundColor: 'rgba(245, 158, 11, 0.15)' },
  sale: { color: '#059669', backgroundColor: 'rgba(16, 185, 129, 0.12)' },
};

export const STATUS_OPTIONS = [
  { value: 'collection', label: STATUS_LABEL.collection },
  { value: 'trade', label: STATUS_LABEL.trade },
  { value: 'sale', label: STATUS_LABEL.sale },
];
