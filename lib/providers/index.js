import * as mtg from './mtg';
import * as pokemon from './pokemon';
import * as ygo from './ygo';
import * as lorcana from './lorcana';
import * as onepiece from './onepiece';
import * as digimon from './digimon';

const PROVIDERS = { mtg, pokemon, ygo, lorcana, onepiece, digimon };

export function searchCards(game, query) {
  const provider = PROVIDERS[game];
  if (!provider) throw new Error(`Juego no soportado: ${game}`);
  return provider.searchCards(query);
}

export function getSets(game) {
  const provider = PROVIDERS[game];
  if (!provider) throw new Error(`Juego no soportado: ${game}`);
  return provider.getSets();
}

export function getCardsBySet(game, setId) {
  const provider = PROVIDERS[game];
  if (!provider) throw new Error(`Juego no soportado: ${game}`);
  return provider.getCardsBySet(setId);
}
