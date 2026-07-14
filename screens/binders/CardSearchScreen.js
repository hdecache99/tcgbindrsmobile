import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { searchCards, getSets, getCardsBySet } from '../../lib/providers';
import { addCardToBinder } from '../../lib/binderCards';
import { useCurrency } from '../../lib/CurrencyContext';
import { convertPrice } from '../../lib/currency';
import { GAME_OPTIONS } from '../../constants/games';
import PillSelector from '../../components/PillSelector';
import TextField from '../../components/TextField';
import Button from '../../components/Button';
import ErrorText from '../../components/ErrorText';
import EmptyState from '../../components/EmptyState';
import CardThumbnail from '../../components/binders/CardThumbnail';
import SetListItem from '../../components/binders/SetListItem';
import { fonts, radius, spacing } from '../../theme';
import { useTheme } from '../../lib/ThemeContext';

const MODE_OPTIONS = [
  { value: 'name', label: 'Por nombre' },
  { value: 'set', label: 'Por expansión' },
];

const NUM_COLUMNS = 4;

export default function CardSearchScreen({ route, navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { binderId } = route.params;
  const { currency } = useCurrency();
  const [mode, setMode] = useState('name');
  const [game, setGame] = useState('pokemon');

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [addedIds, setAddedIds] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  // Marcado: tocar una carta la marca (cantidad 1 por defecto) en vez de agregarla
  // al instante — así puedes marcar varias, ajustar cuántas copias tienes de cada
  // una en la barra de abajo, y confirmar todo junto con "Agregar seleccionadas".
  const [marked, setMarked] = useState({});
  const [confirming, setConfirming] = useState(false);

  const [sets, setSets] = useState([]);
  const [setsLoading, setSetsLoading] = useState(false);
  const [setFilter, setSetFilter] = useState('');
  const [selectedSet, setSelectedSet] = useState(null);

  // Al cambiar de juego o de modo "por expansión", carga la lista de sets de ese juego.
  // "active" evita que una respuesta vieja (ej. cambiaste de juego rápido y la petición
  // anterior tarda más en responder que la nueva) pise el resultado correcto más reciente.
  useEffect(() => {
    if (mode !== 'set') return;
    let active = true;
    setSelectedSet(null);
    setResults([]);
    setSetsLoading(true);
    getSets(game)
      .then((data) => {
        if (active) setSets(data);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setSetsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [mode, game]);

  // Igual que el guard de la lista de sets: si dos búsquedas quedan "al aire" a la
  // vez (ej. tocaste Buscar, cambiaste de set rápido), solo la más reciente puede
  // escribir el resultado.
  const requestIdRef = useRef(0);

  async function handleSearch() {
    const requestId = ++requestIdRef.current;
    setError(null);
    setLoading(true);
    setSearched(true);
    try {
      const cards = await searchCards(game, query.trim());
      if (requestIdRef.current === requestId) setResults(cards);
    } catch (err) {
      if (requestIdRef.current === requestId) setError(err.message);
    } finally {
      if (requestIdRef.current === requestId) setLoading(false);
    }
  }

  async function handlePickSet(set) {
    const requestId = ++requestIdRef.current;
    setError(null);
    setSelectedSet(set);
    setLoading(true);
    try {
      const cards = await getCardsBySet(game, set.id);
      if (requestIdRef.current === requestId) setResults(cards);
    } catch (err) {
      if (requestIdRef.current === requestId) setError(err.message);
    } finally {
      if (requestIdRef.current === requestId) setLoading(false);
    }
  }

  function toggleMarked(card) {
    setMarked((prev) => {
      if (prev[card.id]) {
        const next = { ...prev };
        delete next[card.id];
        return next;
      }
      return { ...prev, [card.id]: { card, quantity: 1 } };
    });
  }

  function changeQuantity(cardId, delta) {
    setMarked((prev) => {
      const entry = prev[cardId];
      if (!entry) return prev;
      const quantity = Math.max(1, entry.quantity + delta);
      return { ...prev, [cardId]: { ...entry, quantity } };
    });
  }

  function removeMarked(cardId) {
    setMarked((prev) => {
      const next = { ...prev };
      delete next[cardId];
      return next;
    });
  }

  const markedList = Object.values(marked);
  const totalCopies = markedList.reduce((sum, entry) => sum + entry.quantity, 0);

  // Con cartas marcadas, el gesto de swipe-back (o el botón atrás) debe
  // desmarcar todo en vez de salir de la pantalla — mismo patrón que en
  // BinderDetailScreen para selección/reordenar.
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (markedList.length === 0) return;
      e.preventDefault();
      setMarked({});
    });
    return unsubscribe;
  }, [navigation, markedList.length]);

  async function handleConfirmAdd() {
    if (markedList.length === 0) return;
    setConfirming(true);
    setError(null);
    try {
      // Secuencial, no Promise.all: addCardToBinder calcula la próxima `position`
      // consultando el máximo actual, así que insertar en paralelo dejaría a varias
      // cartas con la misma posición.
      for (const entry of markedList) {
        await addCardToBinder(binderId, entry.card, entry.quantity, currency);
      }
      setAddedIds((prev) => {
        const next = { ...prev };
        markedList.forEach((entry) => {
          next[entry.card.id] = true;
        });
        return next;
      });
      setMarked({});
    } catch (err) {
      setError(err.message);
    } finally {
      setConfirming(false);
    }
  }

  const filteredSets = sets.filter((s) => s.name.toLowerCase().includes(setFilter.trim().toLowerCase()));

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <PillSelector
          options={MODE_OPTIONS}
          value={mode}
          onChange={(m) => {
            setMode(m);
            setResults([]);
            setSearched(false);
          }}
        />

        <View style={styles.spacer} />
        <PillSelector options={GAME_OPTIONS} value={game} onChange={setGame} columns={3} />

        {mode === 'name' ? (
          <>
            <View style={styles.searchInputWrapper}>
              <TextField
                placeholder="Buscar por nombre..."
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
            </View>
            <Button title="Buscar" onPress={handleSearch} loading={loading} style={styles.searchButton} />
          </>
        ) : selectedSet ? (
          <TouchableOpacity style={styles.backRow} onPress={() => { setSelectedSet(null); setResults([]); }}>
            <Text style={styles.backText}>← {selectedSet.name}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.searchInputWrapper}>
            <TextField placeholder="Filtrar expansiones..." value={setFilter} onChangeText={setFilter} />
          </View>
        )}
      </View>

      <ErrorText>{error}</ErrorText>

      {mode === 'set' && !selectedSet ? (
        setsLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
        ) : (
          <FlatList
            data={filteredSets}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<EmptyState message="No encontramos expansiones para ese juego." />}
            renderItem={({ item }) => <SetListItem set={item} onPress={() => handlePickSet(item)} />}
          />
        )
      ) : loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={styles.gridContent}
          ListEmptyComponent={
            searched || selectedSet ? (
              <EmptyState message="No encontramos cartas." />
            ) : (
              <EmptyState message="Elige un juego y busca una carta para agregar." />
            )
          }
          renderItem={({ item }) => (
            <CardThumbnail
              card={item}
              price={convertPrice(item.price?.market, 'USD', currency)}
              numColumns={NUM_COLUMNS}
              onPress={addedIds[item.id] ? undefined : () => toggleMarked(item)}
              added={!!addedIds[item.id]}
              selectionMode={!addedIds[item.id]}
              selected={!!marked[item.id]}
              quantity={marked[item.id]?.quantity}
            />
          )}
        />
      )}

      {markedList.length > 0 ? (
        <View style={styles.markedBar}>
          <FlatList
            horizontal
            data={markedList}
            keyExtractor={(entry) => entry.card.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.markedList}
            renderItem={({ item: entry }) => (
              <View style={styles.markedChip}>
                <TouchableOpacity style={styles.markedRemove} onPress={() => removeMarked(entry.card.id)}>
                  <Ionicons name="close" size={14} color={colors.mutedForeground} />
                </TouchableOpacity>
                <Text style={styles.markedName} numberOfLines={1}>
                  {entry.card.name}
                </Text>
                <View style={styles.stepper}>
                  <TouchableOpacity
                    style={styles.stepperButton}
                    onPress={() => changeQuantity(entry.card.id, -1)}
                  >
                    <Text style={styles.stepperButtonText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepperValue}>{entry.quantity}</Text>
                  <TouchableOpacity
                    style={styles.stepperButton}
                    onPress={() => changeQuantity(entry.card.id, 1)}
                  >
                    <Text style={styles.stepperButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />

          <View style={styles.markedFooter}>
            <Text style={styles.markedSummary}>
              {markedList.length} carta(s) · {totalCopies} copia(s)
            </Text>
            <Button
              title="Agregar seleccionadas"
              onPress={handleConfirmAdd}
              loading={confirming}
              style={styles.confirmButton}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchBar: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  spacer: {
    height: spacing.sm,
  },
  searchInputWrapper: {
    marginTop: spacing.md,
  },
  searchButton: {
    marginTop: spacing.sm,
  },
  backRow: {
    marginTop: spacing.md,
  },
  backText: {
    color: colors.primary,
    fontFamily: fonts.semibold,
  },
  spinner: {
    marginTop: 40,
  },
  listContent: {
    padding: spacing.lg,
  },
  gridContent: {
    padding: 8,
    paddingBottom: 140,
  },
  markedBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  markedList: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  markedChip: {
    width: 120,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  markedRemove: {
    position: 'absolute',
    top: 2,
    right: 4,
    padding: 4,
  },
  markedName: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.foreground,
    marginRight: 16,
    marginBottom: spacing.sm,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperButton: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: {
    color: '#fff',
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 16,
  },
  stepperValue: {
    fontFamily: fonts.semibold,
    color: colors.foreground,
    fontSize: 14,
  },
  markedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  markedSummary: {
    fontFamily: fonts.semibold,
    color: colors.foreground,
    fontSize: 13,
  },
  confirmButton: {
    flex: 1,
    marginLeft: spacing.md,
  },
  });
}
