import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { quickScanCard } from '../../lib/scanner';
import { searchCards } from '../../lib/providers';
import { searchCardInCommunity } from '../../lib/discover';
import { useCurrency } from '../../lib/CurrencyContext';
import { convertPrice, formatPrice } from '../../lib/currency';
import { GAME_OPTIONS } from '../../constants/games';
import AppHeader from '../../components/AppHeader';
import Button from '../../components/Button';
import TextField from '../../components/TextField';
import PillSelector from '../../components/PillSelector';
import FieldLabel from '../../components/FieldLabel';
import ErrorText from '../../components/ErrorText';
import VariantListItem from '../../components/binders/VariantListItem';
import CardInBinderResultItem from '../../components/binders/CardInBinderResultItem';
import EmptyState from '../../components/EmptyState';
import { useTheme } from '../../lib/ThemeContext';
import { fonts, radius, spacing } from '../../theme';

// Escaneo rápido de UNA carta solo para ver su precio de mercado al instante
// — no agrega nada a ningún binder. Réplica simplificada del "Quick Scan" FAB
// de la web (QuickPriceScanner.tsx): foto → nombre/set detectado → precio de
// mercado grande + rango de precio. En vez de las secciones de PSA/idiomas
// (quitadas — los multiplicadores fijos del servidor no son datos reales de
// mercado), muestra otras cartas candidatas de la misma búsqueda ("¿buscabas
// otra carta?") y quién más tiene esta carta en un binder público. También
// permite buscar por nombre (sin foto) para cuando escribir es más rápido
// que tomar una foto — usa el mismo buscador por juego que CardSearchScreen.
export default function QuickScanScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { currency } = useCurrency();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [chosen, setChosen] = useState(null);
  const [altCards, setAltCards] = useState([]);
  const [communityResults, setCommunityResults] = useState([]);

  const [query, setQuery] = useState('');
  const [game, setGame] = useState('pokemon');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // Al volver a esta pestaña (swipe/tap de vuelta, o al salir de Configuración)
  // se descarta el resultado anterior — siempre lista para escanear una carta
  // nueva en vez de dejar la última carta pegada en pantalla.
  useFocusEffect(
    useCallback(() => {
      reset();
    }, [])
  );

  function reset() {
    setData(null);
    setChosen(null);
    setAltCards([]);
    setCommunityResults([]);
    setError(null);
    setScanning(false);
    setQuery('');
    setSearchResults([]);
  }

  // Trae "otras cartas con este nombre" y "quién la tiene en un binder
  // público" — se usa tanto después de escanear una foto como de elegir un
  // resultado del buscador por texto, para no duplicar la lógica.
  function loadRelated(name, cardGame, excludeId) {
    setAltCards([]);
    setCommunityResults([]);
    if (name && cardGame) {
      searchCards(cardGame, name)
        .then((all) => setAltCards(all.filter((c) => c.id !== excludeId)))
        .catch(() => {});
    }
    if (name) {
      searchCardInCommunity(name).then(setCommunityResults).catch(() => {});
    }
  }

  async function processImage(uri) {
    setScanning(true);
    setError(null);
    setData(null);
    setChosen(null);
    setSearchResults([]);
    try {
      const result = await quickScanCard(uri);
      setData(result);
      setChosen(result.match);
      loadRelated(result.match?.name || result.detection?.name, result.detection?.game, result.match?.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setScanning(false);
    }
  }

  async function handleSearch() {
    if (!query.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const results = await searchCards(game, query.trim());
      setSearchResults(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  }

  function selectSearchResult(card) {
    setSearchResults([]);
    setQuery('');
    setData(null);
    setChosen(card);
    loadRelated(card.name, card.game, card.id);
  }

  async function handleTakePhoto() {
    setError(null);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setError('Necesitas dar permiso de cámara para escanear.');
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

  const match = chosen;
  const marketPrice = match?.price?.market ?? data?.rawNmPrice ?? null;
  const price = (usd) => formatPrice(convertPrice(usd, 'USD', currency), currency);

  function pickAlt(card) {
    setChosen(card);
    setAltCards((prev) => prev.filter((c) => c.id !== card.id).concat(chosen ? [chosen] : []));
  }

  return (
    <View style={styles.container}>
      <AppHeader navigation={navigation} />

      <ScrollView contentContainerStyle={styles.content}>
        <ErrorText>{error}</ErrorText>

        {!chosen && !scanning ? (
          <View style={styles.intro}>
            <Text style={styles.introTitle}>Consulta rápida de precio</Text>
            <Text style={styles.introHint}>
              Escribe el nombre de una carta o toma una foto para ver su precio de mercado al instante.
            </Text>

            <View style={styles.searchBlock}>
              <FieldLabel>Juego</FieldLabel>
              <PillSelector options={GAME_OPTIONS} value={game} onChange={setGame} columns={3} />

              <View style={styles.spacer} />

              <TextField
                placeholder="Nombre de la carta..."
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              <Button title="Buscar" onPress={handleSearch} loading={searching} style={styles.introButton} />
            </View>

            {searchResults.length > 0 ? (
              <View style={styles.searchResults}>
                {searchResults.slice(0, 10).map((card) => (
                  <VariantListItem key={card.id} card={card} onPress={() => selectSearchResult(card)} />
                ))}
              </View>
            ) : null}

            <View style={styles.orDivider}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>o</Text>
              <View style={styles.orLine} />
            </View>

            <Button title="Tomar foto" icon="camera-outline" onPress={handleTakePhoto} style={styles.introButton} />
            <Button
              title="Elegir de galería"
              icon="image-outline"
              variant="secondary"
              onPress={handlePickFromGallery}
              style={styles.introButton}
            />
          </View>
        ) : null}

        {scanning ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.hint}>Analizando con IA...</Text>
          </View>
        ) : null}

        {chosen && !scanning ? (
          <View>
            <View style={styles.hero}>
              {match?.image_url_small ? (
                <Image source={{ uri: match.image_url_small }} style={styles.heroImage} resizeMode="contain" />
              ) : (
                <View style={[styles.heroImage, styles.heroImagePlaceholder]} />
              )}
              <View style={styles.heroInfo}>
                <Text style={styles.heroName} numberOfLines={2}>
                  {match?.name || data?.detection?.name}
                </Text>
                <Text style={styles.heroSet} numberOfLines={1}>
                  {match
                    ? `${match.set_name || ''} ${match.number ? `#${match.number}` : ''}`
                    : data?.detection?.set_name}
                </Text>
              </View>
            </View>

            {marketPrice != null ? (
              <View style={styles.priceCard}>
                <Text style={styles.priceLabel}>Precio de mercado</Text>
                <Text style={styles.priceValue}>{price(marketPrice)}</Text>
              </View>
            ) : (
              <Text style={styles.hint}>No encontramos precio de mercado para esta carta.</Text>
            )}

            {data?.priceHistory?.length ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Rango de precio</Text>
                <View style={styles.rangeRow}>
                  {data.priceHistory.map((p) => (
                    <View key={p.label} style={styles.rangePill}>
                      <Text style={styles.rangePillLabel}>{p.label}</Text>
                      <Text style={styles.rangePillValue}>{p.value != null ? price(p.value) : '—'}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {altCards.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>¿Buscabas otra carta?</Text>
                {altCards.slice(0, 6).map((card) => (
                  <VariantListItem key={card.id} card={card} onPress={() => pickAlt(card)} />
                ))}
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quién tiene esta carta</Text>
              {communityResults.length > 0 ? (
                communityResults.slice(0, 10).map((r) => (
                  <CardInBinderResultItem
                    key={r.id}
                    result={r}
                    onPress={() => navigation.navigate('BinderDetail', { binderId: r.binder.id, title: r.binder.title })}
                  />
                ))
              ) : (
                <EmptyState message="Nadie más tiene esta carta en un binder público todavía." />
              )}
            </View>

            <Button
              title="Buscar otra"
              icon="camera-outline"
              variant="secondary"
              onPress={reset}
              style={styles.rescanButton}
            />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.xl,
    },
    center: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xl * 2,
    },
    hint: {
      fontFamily: fonts.regular,
      color: colors.mutedForeground,
      textAlign: 'center',
      marginTop: spacing.md,
    },
    intro: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
    },
    introTitle: {
      fontFamily: fonts.bold,
      fontSize: 18,
      color: colors.foreground,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    introHint: {
      fontFamily: fonts.regular,
      color: colors.mutedForeground,
      textAlign: 'center',
      marginBottom: spacing.xl,
    },
    introButton: {
      width: '100%',
      marginTop: spacing.sm,
    },
    searchBlock: {
      width: '100%',
    },
    spacer: {
      height: spacing.sm,
    },
    searchResults: {
      width: '100%',
      marginTop: spacing.md,
    },
    orDivider: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      marginVertical: spacing.lg,
    },
    orLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    orText: {
      fontFamily: fonts.medium,
      fontSize: 12,
      color: colors.mutedForeground,
      marginHorizontal: spacing.md,
    },
    hero: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
    },
    heroImage: {
      width: 64,
      height: 88,
      borderRadius: 6,
      backgroundColor: colors.muted,
    },
    heroImagePlaceholder: {
      borderWidth: 1,
      borderColor: colors.border,
    },
    heroInfo: {
      flex: 1,
      marginLeft: spacing.md,
    },
    heroName: {
      fontFamily: fonts.bold,
      fontSize: 16,
      color: colors.foreground,
    },
    heroSet: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: colors.mutedForeground,
      marginTop: 2,
    },
    priceCard: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: radius.lg,
      paddingVertical: spacing.lg,
      marginTop: spacing.md,
    },
    priceLabel: {
      fontFamily: fonts.semibold,
      fontSize: 12,
      color: 'rgba(255,255,255,0.8)',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    priceValue: {
      fontFamily: fonts.extrabold,
      fontSize: 32,
      color: '#fff',
      marginTop: 4,
    },
    section: {
      marginTop: spacing.lg,
    },
    sectionTitle: {
      fontFamily: fonts.bold,
      fontSize: 14,
      color: colors.foreground,
      marginBottom: spacing.sm,
    },
    rangeRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    rangePill: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: spacing.sm,
    },
    rangePillLabel: {
      fontFamily: fonts.medium,
      fontSize: 11,
      color: colors.mutedForeground,
    },
    rangePillValue: {
      fontFamily: fonts.bold,
      fontSize: 14,
      color: colors.foreground,
      marginTop: 2,
    },
    rescanButton: {
      marginTop: spacing.xl,
    },
  });
}
