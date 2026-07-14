import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { ActivityIndicator, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { scanCards } from '../../lib/scanner';
import { addCardToBinder } from '../../lib/binderCards';
import { getUserBinders } from '../../lib/binders';
import { useCurrency } from '../../lib/CurrencyContext';
import ScannedCardItem from '../../components/binders/ScannedCardItem';
import VariantListItem from '../../components/binders/VariantListItem';
import Button from '../../components/Button';
import ErrorText from '../../components/ErrorText';
import EmptyState from '../../components/EmptyState';
import { fonts, spacing } from '../../theme';
import { useTheme } from '../../lib/ThemeContext';

export default function CardScannerScreen({ route, navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  // Sin `binderId` (ej. abierto desde el botón "Escanear" del menú hamburguesa,
  // no desde un binder específico) — se le pregunta al usuario a qué binder
  // agregar justo antes de guardar, en vez de exigir el binder de antemano.
  const { binderId } = route.params || {};
  const { currency } = useCurrency();
  const [scanning, setScanning] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);
  const [cards, setCards] = useState([]);
  const [pickingBinder, setPickingBinder] = useState(false);
  const [userBinders, setUserBinders] = useState([]);
  // Cada carta detectada trae `match` (el mejor intento de la IA) y `variants`
  // (todas las candidatas encontradas) — `chosen` guarda cuál de esas variantes
  // quedó elegida por índice, para no perder el estado si el usuario cambia la
  // carta sugerida por otra de la lista.
  const [chosen, setChosen] = useState({});
  const [selectedIndices, setSelectedIndices] = useState({});
  const [variantPickerIndex, setVariantPickerIndex] = useState(null);
  const [usage, setUsage] = useState(null);

  async function processImage(uri) {
    setScanning(true);
    setCards([]);
    setError(null);
    try {
      const data = await scanCards(uri);
      const detected = data.results?.[0]?.cards ?? [];
      setCards(detected);
      setUsage(data.usage);

      const initialChosen = {};
      const initialSelection = {};
      detected.forEach((c, i) => {
        if (c.match) {
          initialChosen[i] = c.match;
          initialSelection[i] = true;
        }
      });
      setChosen(initialChosen);
      setSelectedIndices(initialSelection);
    } catch (err) {
      setError(err.message);
    } finally {
      setScanning(false);
    }
  }

  async function handleTakePhoto() {
    setError(null);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setError('Necesitas dar permiso de cámara para escanear cartas.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (result.canceled) return;
    await processImage(result.assets[0].uri);
  }

  async function handlePickFromGallery() {
    setError(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError('Necesitas dar permiso para acceder a tus fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled) return;
    await processImage(result.assets[0].uri);
  }

  function toggle(index) {
    setSelectedIndices((prev) => ({ ...prev, [index]: !prev[index] }));
  }

  function selectVariant(index, variant) {
    setChosen((prev) => ({ ...prev, [index]: variant }));
    setSelectedIndices((prev) => ({ ...prev, [index]: true }));
    setVariantPickerIndex(null);
  }

  function getSelectedCards() {
    return Object.keys(selectedIndices)
      .filter((i) => selectedIndices[i] && chosen[i])
      .map((i) => chosen[i]);
  }

  async function handleAddSelected() {
    if (getSelectedCards().length === 0) return;

    if (!binderId) {
      setError(null);
      const binders = await getUserBinders();
      if (binders.length === 0) {
        setError('Todavía no tienes binders — crea uno primero para poder agregar cartas.');
        return;
      }
      setUserBinders(binders);
      setPickingBinder(true);
      return;
    }

    await addToBinder(binderId);
  }

  async function addToBinder(targetBinderId) {
    const toAdd = getSelectedCards();
    setPickingBinder(false);
    setAdding(true);
    setError(null);
    try {
      for (const card of toAdd) {
        await addCardToBinder(targetBinderId, card, 1, currency);
      }
      navigation.goBack();
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  }

  const selectedCount = Object.values(selectedIndices).filter(Boolean).length;
  const activeVariants = variantPickerIndex != null ? cards[variantPickerIndex]?.variants ?? [] : [];

  if (scanning) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.hint}>Analizando con IA...</Text>
      </View>
    );
  }

  if (cards.length === 0) {
    return (
      <View style={styles.center}>
        <ErrorText>{error}</ErrorText>
        <Text style={styles.hint}>
          Toma una foto de una o varias cartas — funciona incluso con una página completa de binder.
        </Text>
        <Button title="Tomar foto" icon="camera-outline" onPress={handleTakePhoto} style={styles.photoButton} />
        <Button
          title="Elegir de galería"
          icon="image-outline"
          variant="secondary"
          onPress={handlePickFromGallery}
          style={styles.photoButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ErrorText>{error}</ErrorText>

      {usage ? (
        <Text style={styles.usage}>
          {usage.used}/{usage.limit} escaneos usados ({usage.windowHours}h)
        </Text>
      ) : null}

      <FlatList
        data={cards}
        keyExtractor={(_item, index) => `card-${index}`}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<EmptyState message="No se detectaron cartas en la foto." />}
        renderItem={({ item, index }) => (
          <ScannedCardItem
            scanned={{ ...item, match: chosen[index] || item.match }}
            selected={!!selectedIndices[index]}
            onToggle={() => toggle(index)}
            onChangeCard={item.variants?.length > 1 ? () => setVariantPickerIndex(index) : undefined}
          />
        )}
      />

      <View style={styles.actions}>
        <Button title="Otra foto" variant="secondary" onPress={handleTakePhoto} style={styles.actionButton} />
        <Button
          title={`Agregar ${selectedCount}`}
          onPress={handleAddSelected}
          loading={adding}
          disabled={selectedCount === 0}
          style={styles.actionButton}
        />
      </View>

      <Modal
        visible={variantPickerIndex != null}
        animationType="slide"
        transparent
        onRequestClose={() => setVariantPickerIndex(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Elige la carta correcta</Text>
            <FlatList
              data={activeVariants}
              keyExtractor={(v) => v.id}
              renderItem={({ item }) => (
                <VariantListItem card={item} onPress={() => selectVariant(variantPickerIndex, item)} />
              )}
              ListEmptyComponent={<EmptyState message="No hay otras variantes para esta carta." />}
            />
            <Button title="Cancelar" variant="secondary" onPress={() => setVariantPickerIndex(null)} />
          </View>
        </View>
      </Modal>

      <Modal visible={pickingBinder} animationType="slide" transparent onRequestClose={() => setPickingBinder(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>¿A qué binder agregas?</Text>
            <FlatList
              data={userBinders}
              keyExtractor={(b) => b.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.binderOption} onPress={() => addToBinder(item.id)}>
                  <Text style={styles.binderOptionText}>{item.title}</Text>
                  <Text style={styles.binderOptionCount}>{item.card_count} cartas</Text>
                </TouchableOpacity>
              )}
            />
            <Button title="Cancelar" variant="secondary" onPress={() => setPickingBinder(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  hint: {
    fontFamily: fonts.regular,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  photoButton: {
    width: '100%',
    marginTop: spacing.sm,
  },
  usage: {
    fontFamily: fonts.medium,
    color: colors.mutedForeground,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    maxHeight: '75%',
  },
  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.foreground,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  binderOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  binderOptionText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.foreground,
  },
  binderOptionCount: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.mutedForeground,
  },
  });
}
