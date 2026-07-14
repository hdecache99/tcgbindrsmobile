function mapCard(card) {
  const imageUrl = `https://images.digimoncard.io/images/cards/${card.id}.jpg`;
  return {
    id: `dig_${card.id}`,
    game: 'digimon',
    name: card.name,
    set_name: card.set_name || null,
    set_code: card.id?.split('-')[0] || null,
    number: card.id,
    image_url: imageUrl,
    image_url_small: imageUrl,
    price: null, // esta API no expone precios
    raw: card,
  };
}

// La API de Digimon no tiene endpoint de sets, así que la lista es fija
// (igual que hace tu web).
const DIGIMON_SETS = [
  { id: 'BT1', code: 'BT1', name: 'New Evolution', game: 'digimon' },
  { id: 'BT2', code: 'BT2', name: 'Ultimate Power', game: 'digimon' },
  { id: 'BT3', code: 'BT3', name: 'Union Impact', game: 'digimon' },
  { id: 'BT4', code: 'BT4', name: 'Great Legend', game: 'digimon' },
  { id: 'BT5', code: 'BT5', name: 'Battle of Omni', game: 'digimon' },
  { id: 'BT6', code: 'BT6', name: 'Double Diamond', game: 'digimon' },
  { id: 'BT7', code: 'BT7', name: 'Next Adventure', game: 'digimon' },
  { id: 'BT8', code: 'BT8', name: 'New Hero', game: 'digimon' },
  { id: 'BT9', code: 'BT9', name: 'X Record', game: 'digimon' },
  { id: 'BT10', code: 'BT10', name: 'Xros Encounter', game: 'digimon' },
  { id: 'BT11', code: 'BT11', name: 'Dimensional Phase', game: 'digimon' },
  { id: 'BT12', code: 'BT12', name: 'Across Time', game: 'digimon' },
  { id: 'BT13', code: 'BT13', name: 'Versus Royal Knights', game: 'digimon' },
  { id: 'BT14', code: 'BT14', name: 'Blast Ace', game: 'digimon' },
  { id: 'BT15', code: 'BT15', name: 'Exceed Apocalypse', game: 'digimon' },
  { id: 'BT16', code: 'BT16', name: 'Beginning Observer', game: 'digimon' },
  { id: 'BT17', code: 'BT17', name: 'Secret Crisis', game: 'digimon' },
  { id: 'EX1', code: 'EX1', name: 'Classic Collection', game: 'digimon' },
  { id: 'EX2', code: 'EX2', name: 'Digital Hazard', game: 'digimon' },
  { id: 'EX3', code: 'EX3', name: 'Draconic Roar', game: 'digimon' },
  { id: 'EX4', code: 'EX4', name: 'Alternative Being', game: 'digimon' },
  { id: 'EX5', code: 'EX5', name: 'Animal Colosseum', game: 'digimon' },
  { id: 'EX6', code: 'EX6', name: 'Infernal Ascension', game: 'digimon' },
  { id: 'EX7', code: 'EX7', name: 'Digimon Liberator', game: 'digimon' },
  { id: 'RB1', code: 'RB1', name: 'Reboot Booster', game: 'digimon' },
  { id: 'ST1', code: 'ST1', name: 'Starter Deck: Gaia Red', game: 'digimon' },
  { id: 'ST2', code: 'ST2', name: 'Starter Deck: Cocytus Blue', game: 'digimon' },
  { id: 'ST3', code: 'ST3', name: "Starter Deck: Heaven's Yellow", game: 'digimon' },
  { id: 'ST4', code: 'ST4', name: 'Starter Deck: Giga Green', game: 'digimon' },
  { id: 'ST5', code: 'ST5', name: 'Starter Deck: Machine Black', game: 'digimon' },
  { id: 'ST6', code: 'ST6', name: 'Starter Deck: Venomous Violet', game: 'digimon' },
  { id: 'ST7', code: 'ST7', name: 'Starter Deck: Gallantmon', game: 'digimon' },
  { id: 'ST8', code: 'ST8', name: 'Starter Deck: UlforceVeedramon', game: 'digimon' },
  { id: 'ST9', code: 'ST9', name: 'Starter Deck: Ultimate Ancient Dragon', game: 'digimon' },
  { id: 'ST10', code: 'ST10', name: 'Starter Deck: Parallel World Tactician', game: 'digimon' },
  { id: 'ST12', code: 'ST12', name: 'Starter Deck: Jesmon', game: 'digimon' },
  { id: 'ST13', code: 'ST13', name: 'Starter Deck: Ragnaloardmon', game: 'digimon' },
  { id: 'ST14', code: 'ST14', name: 'Starter Deck: Beelzemon', game: 'digimon' },
  { id: 'ST15', code: 'ST15', name: 'Starter Deck: Dragon of Courage', game: 'digimon' },
  { id: 'ST16', code: 'ST16', name: 'Starter Deck: Wolf of Friendship', game: 'digimon' },
];

export async function searchCards(query) {
  if (!query || query.length < 2) return [];

  const res = await fetch(
    `https://digimoncard.io/api-public/search.php?n=${encodeURIComponent(query)}&series=Digimon Card Game`
  );
  if (!res.ok) return [];

  const json = await res.json();
  return (Array.isArray(json) ? json : []).slice(0, 50).map(mapCard);
}

export async function getSets() {
  return DIGIMON_SETS;
}

export async function getCardsBySet(setCode) {
  const res = await fetch(`https://digimoncard.io/api-public/search.php?card=${encodeURIComponent(setCode)}`);
  if (!res.ok) return [];
  const json = await res.json();
  return (Array.isArray(json) ? json : []).slice(0, 200).map(mapCard);
}
