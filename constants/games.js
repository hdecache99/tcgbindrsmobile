export const GAME_LABEL = {
  mtg: 'Magic',
  pokemon: 'Pokémon',
  ygo: 'Yu-Gi-Oh!',
  lorcana: 'Lorcana',
  onepiece: 'One Piece',
  digimon: 'Digimon',
};

export const GAME_OPTIONS = Object.entries(GAME_LABEL).map(([value, label]) => ({ value, label }));
