export const CONDITION_LABEL = {
  M: 'Mint',
  NM: 'Near Mint',
  LP: 'Ligeramente jugada',
  MP: 'Jugada',
  HP: 'Muy jugada',
  P: 'Pobre',
};

export const CONDITION_OPTIONS = Object.entries(CONDITION_LABEL).map(([value, label]) => ({ value, label }));

export const FINISH_LABEL = {
  normal: 'Normal',
  foil: 'Foil',
  holo: 'Holo',
  reverse: 'Reverse',
  etched: 'Etched',
};

export const FINISH_OPTIONS = Object.entries(FINISH_LABEL).map(([value, label]) => ({ value, label }));

export const LANGUAGE_OPTIONS = ['EN', 'ES', 'JP', 'FR', 'DE', 'IT', 'PT', 'KO'].map((value) => ({
  value,
  label: value,
}));
