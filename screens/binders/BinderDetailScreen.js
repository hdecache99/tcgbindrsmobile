import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Alert, FlatList, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getBinder, getBinderCards } from '../../lib/binders';
import { markCardAsSold, removeCardFromBinder, reorderBinderCards } from '../../lib/binderCards';
import { useCurrency } from '../../lib/CurrencyContext';
import { formatPrice } from '../../lib/currency';
import { getTagColor } from '../../lib/tagColor';
import { supabase } from '../../lib/supabase';
import { writeBinderToNfc } from '../../lib/nfc';
import { STATUS_OPTIONS } from '../../constants/cardStatus';
import { SORT_OPTIONS } from '../../constants/sort';
import CardThumbnail from '../../components/binders/CardThumbnail';
import EmptyState from '../../components/EmptyState';
import Button from '../../components/Button';
import TextField from '../../components/TextField';
import PillSelector from '../../components/PillSelector';
import FieldLabel from '../../components/FieldLabel';
import SpeedDialFab from '../../components/binders/SpeedDialFab';
import BinderIntro from '../../components/binders/BinderIntro';
import ColorAura from '../../components/binders/ColorAura';
import SellQuantityModal from '../../components/binders/SellQuantityModal';
import BulkSellModal from '../../components/binders/BulkSellModal';
import { fonts, spacing } from '../../theme';
import { useTheme } from '../../lib/ThemeContext';

const STATUS_FILTER_OPTIONS = [{ value: 'all', label: 'Todas' }, ...STATUS_OPTIONS];
const ALL_TAGS = { value: 'all', label: 'Todas' };

export default function BinderDetailScreen({ route, navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { binderId, title } = route.params;
  const { currency } = useCurrency();
  const [binder, setBinder] = useState(null);
  const [cards, setCards] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [tagFilter, setTagFilter] = useState('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [writingNfc, setWritingNfc] = useState(false);

  // La animación de portada solo la ve un visitante (nunca el dueño editando,
  // igual que la web) y solo una vez por visita a la pantalla — no se vuelve
  // a mostrar aunque refresque al volver de otra pantalla (useFocusEffect).
  const [showIntro, setShowIntro] = useState(true);

  // Selección múltiple: solo el dueño puede entrar (toque largo en una carta,
  // o el link "Seleccionar"). En modo selección, tocar una carta la marca/desmarca
  // en vez de abrir su detalle.
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState({});
  const [bulkWorking, setBulkWorking] = useState(false);

  // Reordenar: modo aparte y excluyente con la selección múltiple. Usa la lista
  // `cards` tal cual (ya viene ordenada por `position` desde getBinderCards), nunca
  // `filteredCards` — reordenar con un filtro/búsqueda activos daría posiciones sin
  // sentido para las cartas que quedaron fuera de la vista.
  // Interacción: tocar una carta la "levanta" (moveFromId); tocar una segunda carta
  // la suelta en esa posición. No es un drag físico: en un grid de 4 columnas,
  // arrastrar con el dedo es impreciso y react-native-draggable-flatlist no soporta
  // grids multi-columna de todos modos.
  const [reorderMode, setReorderMode] = useState(false);
  const [moveFromId, setMoveFromId] = useState(null);

  // Carta en espera de que el dueño confirme cuántas copias vendió (solo se
  // usa cuando hay más de 1 copia — con 1 sola no hace falta preguntar).
  const [sellingCard, setSellingCard] = useState(null);
  const [bulkSellModalOpen, setBulkSellModalOpen] = useState(false);

  // El color de tema del binder tiñe también la barra de navegación (título +
  // flecha de volver), no solo los botones de dentro de la pantalla — así se
  // nota apenas entras, no hay que buscarlo.
  useEffect(() => {
    const accent = binder?.theme_color || colors.primary;
    navigation.setOptions({
      title: binder?.title || title,
      headerTintColor: accent,
      headerTitleStyle: { fontFamily: fonts.bold, color: colors.foreground },
    });
  }, [title, binder]);

  const load = useCallback(async () => {
    const [{ data: { user } }, binderData, cardsData] = await Promise.all([
      supabase.auth.getUser(),
      getBinder(binderId),
      getBinderCards(binderId),
    ]);
    setCurrentUserId(user.id);
    setBinder(binderData);
    setCards(cardsData);
    setLoading(false);
  }, [binderId]);

  // Dos disparadores distintos y necesarios:
  // 1) useEffect por binderId — si esta MISMA pantalla ya estaba montada (ej. navegaste
  //    de un binder tuyo a uno ajeno vía perfil de usuario), React Navigation reutiliza
  //    la instancia y solo cambia route.params; sin esto, "isOwner" se queda con el
  //    valor viejo porque useFocusEffect no reacciona a cambios de params, solo a foco.
  // 2) useFocusEffect — refresca al volver de CardSearch/CardDetail/BinderSettings.
  useEffect(() => {
    setLoading(true);
    load();
  }, [binderId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Con selección o reordenar activos, el gesto de swipe-back (o el botón atrás)
  // no debe salir de la pantalla — primero debe cancelar el modo. `beforeRemove`
  // intercepta cualquier intento de salir (swipe, header, botón físico Android)
  // igual, así que un solo listener cubre los tres casos.
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!selectionMode && !reorderMode) return;
      e.preventDefault();
      exitSelectionMode();
      setReorderMode(false);
      setMoveFromId(null);
    });
    return unsubscribe;
  }, [navigation, selectionMode, reorderMode]);

  const isOwner = binder && currentUserId === binder.owner_id;
  // Fijo en 4: `cards_per_page` tiene un CHECK (IN 4,6,9,12,16) en Supabase
  // pensado para las 4 densidades de página del visor de escritorio de la
  // web — no para elegir libremente el ancho del grid en el teléfono.
  const numColumns = 4;
  const accentColor = binder?.theme_color || colors.primary;

  const tagOptions = useMemo(() => {
    const tags = new Set();
    cards.forEach((c) => {
      if (c.notes?.trim()) tags.add(c.notes.trim());
    });
    return [ALL_TAGS, ...Array.from(tags).map((t) => ({ value: t, label: t }))];
  }, [cards]);

  const filteredCards = useMemo(() => {
    let result = cards.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (tagFilter !== 'all' && item.notes?.trim() !== tagFilter) return false;
      if (query.trim() && !item.card?.name?.toLowerCase().includes(query.trim().toLowerCase())) return false;
      return true;
    });

    if (sortBy === 'name') {
      result = [...result].sort((a, b) => (a.card?.name || '').localeCompare(b.card?.name || ''));
    } else if (sortBy === 'price_desc') {
      result = [...result].sort((a, b) => (b.ask_price ?? 0) - (a.ask_price ?? 0));
    } else if (sortBy === 'price_asc') {
      result = [...result].sort((a, b) => (a.ask_price ?? 0) - (b.ask_price ?? 0));
    }

    return result;
  }, [cards, query, statusFilter, tagFilter, sortBy]);

  function exitSelectionMode() {
    setSelectionMode(false);
    setSelectedIds({});
  }

  function toggleSelected(id) {
    setSelectedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleCardPress(binderCard) {
    if (selectionMode) {
      toggleSelected(binderCard.id);
      return;
    }
    // CardDetailScreen verifica la propiedad por sí mismo (no le pasamos isOwner
    // aquí): así no hereda un valor viejo si esta pantalla reutilizó su instancia.
    navigation.navigate('CardDetail', { binderCard });
  }

  function handleCardLongPress(binderCard) {
    if (!isOwner) return;
    setSelectionMode(true);
    toggleSelected(binderCard.id);
  }

  function handleQuickSell(binderCard) {
    if ((binderCard.quantity ?? 1) > 1) {
      setSellingCard(binderCard);
      return;
    }
    Alert.alert(
      'Marcar como vendida',
      `¿Vender "${binderCard.card?.name}" por ${formatPrice(binderCard.ask_price ?? 0, currency)}? Se quita del binder y queda en tu historial de ventas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar venta',
          onPress: async () => {
            await markCardAsSold(binderCard, binderCard.ask_price ?? 0, currency);
            load();
          },
        },
      ]
    );
  }

  async function handleConfirmSellQuantity(soldQty) {
    await markCardAsSold(sellingCard, sellingCard.ask_price ?? 0, currency, soldQty);
    setSellingCard(null);
    load();
  }

  function handleReorderTap(binderCard) {
    if (!moveFromId) {
      setMoveFromId(binderCard.id);
      return;
    }
    if (moveFromId === binderCard.id) {
      setMoveFromId(null);
      return;
    }

    const fromIndex = cards.findIndex((c) => c.id === moveFromId);
    const toIndex = cards.findIndex((c) => c.id === binderCard.id);
    const reordered = [...cards];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    setCards(reordered);
    setMoveFromId(null);
    reorderBinderCards(reordered);
  }

  const selectedCards = cards.filter((c) => selectedIds[c.id]);

  function handleBulkDelete() {
    if (selectedCards.length === 0) return;
    Alert.alert('Eliminar cartas', `¿Eliminar ${selectedCards.length} carta(s) del binder?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          setBulkWorking(true);
          await Promise.all(selectedCards.map((c) => removeCardFromBinder(c.id)));
          setBulkWorking(false);
          exitSelectionMode();
          load();
        },
      },
    ]);
  }

  function handleBulkSell() {
    if (selectedCards.length === 0) return;
    setBulkSellModalOpen(true);
  }

  async function handleConfirmBulkSell(quantities) {
    setBulkWorking(true);
    await Promise.all(
      selectedCards.map((c) => markCardAsSold(c, c.ask_price ?? 0, currency, quantities[c.id]))
    );
    setBulkWorking(false);
    setBulkSellModalOpen(false);
    exitSelectionMode();
    load();
  }

  // "Ordenado rápido": cierra los huecos que dejan las cartas eliminadas
  // (ej. posiciones 1,2,5,9 → 1,2,3,4) sin cambiar el orden visual. Reutiliza
  // reorderBinderCards tal cual, que ya solo actualiza las filas cuya posición
  // cambió.
  async function handleCompactPositions() {
    await reorderBinderCards(cards);
    load();
  }

  // Compartir funciona tanto en tu propio binder como en uno ajeno — solo
  // necesita el id, no depende de isOwner.
  async function handleShare() {
    const url = `https://www.tcgbindrs.com/b/${binderId}`;
    try {
      await Share.share({
        message: `Mira este binder en TCGBINDRS: "${binder?.title || title}"\n${url}`,
        url,
      });
    } catch {
      // el usuario cerró la hoja de compartir sin elegir nada — no hace falta manejarlo
    }
  }

  // Escribe el link público del binder en una etiqueta NFC física — igual
  // que "Compartir", funciona en cualquier binder que se esté viendo, no
  // solo en los propios.
  async function handleWriteNfc() {
    setWritingNfc(true);
    try {
      Alert.alert('Acerca tu teléfono', 'Mantén tu teléfono cerca de la etiqueta NFC hasta que termine de escribir.');
      await writeBinderToNfc(binderId);
      Alert.alert('¡Listo!', 'El binder quedó guardado en la etiqueta NFC.');
    } catch (err) {
      Alert.alert('No se pudo escribir', err.message || 'Intenta de nuevo, acercando bien la etiqueta.');
    } finally {
      setWritingNfc(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const fabActions = isOwner
    ? [
        { icon: 'sparkles-outline', label: 'Ordenado rápido', onPress: handleCompactPositions },
        { icon: 'share-outline', label: 'Exportar', onPress: () => navigation.navigate('BinderExport', { binder }) },
        { icon: 'bookmark-outline', label: 'Marcadores', onPress: () => setCategoriesOpen((o) => !o) },
        { icon: 'camera-outline', label: 'Escanear', onPress: () => navigation.navigate('CardScanner', { binderId }) },
        { icon: 'add-circle-outline', label: 'Agregar cartas', onPress: () => navigation.navigate('CardSearch', { binderId }) },
      ]
    : null;

  return (
    <View style={styles.container}>
      <ColorAura color={accentColor} />
      <View style={styles.headerWrap}>
        <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
        <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTopLeft}>
            {isOwner ? (
              <View style={styles.actionsRow}>
                <Button
                  title="Config."
                  icon="settings-outline"
                  variant="secondary"
                  compact
                  textColor={accentColor}
                  onPress={() => navigation.navigate('BinderSettings', { binder })}
                  style={[styles.actionButton, { borderColor: accentColor }]}
                />

                {cards.length > 1 && !selectionMode ? (
                  <Button
                    title={reorderMode ? 'Listo' : 'Ordenar'}
                    icon={reorderMode ? 'checkmark-outline' : 'swap-vertical-outline'}
                    variant="secondary"
                    compact
                    onPress={() => {
                      setReorderMode((r) => !r);
                      setMoveFromId(null);
                    }}
                    style={styles.actionButton}
                  />
                ) : null}

                {cards.length > 0 && !reorderMode ? (
                  <Button
                    title={selectionMode ? 'Cancelar' : 'Marcar'}
                    icon={selectionMode ? 'close-outline' : 'checkbox-outline'}
                    variant="secondary"
                    compact
                    onPress={selectionMode ? exitSelectionMode : () => setSelectionMode(true)}
                    style={styles.actionButton}
                  />
                ) : null}
              </View>
            ) : binder?.owner ? (
              <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { username: binder.owner.username })}>
                <Text style={styles.ownerLine}>de @{binder.owner.username}</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={20} color={accentColor} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareButton} onPress={handleWriteNfc} disabled={writingNfc}>
            {writingNfc ? (
              <ActivityIndicator size="small" color={accentColor} />
            ) : (
              <MaterialCommunityIcons name="nfc-tap" size={20} color={accentColor} />
            )}
          </TouchableOpacity>
        </View>

        {cards.length > 0 && !reorderMode ? (
          <>
            <TextField
              placeholder="Buscar en este binder..."
              value={query}
              onChangeText={setQuery}
            />

            <TouchableOpacity style={styles.filtersToggle} onPress={() => setFiltersOpen((o) => !o)}>
              <Text style={styles.filtersToggleText}>{filtersOpen ? '▲ Ocultar filtros' : '▾ Filtros'}</Text>
            </TouchableOpacity>

            {filtersOpen ? (
              <View style={styles.filtersPanel}>
                <FieldLabel>Estado</FieldLabel>
                <PillSelector options={STATUS_FILTER_OPTIONS} value={statusFilter} onChange={setStatusFilter} />

                <View style={styles.spacer} />
                <FieldLabel>Ordenar</FieldLabel>
                <PillSelector options={SORT_OPTIONS} value={sortBy} onChange={setSortBy} />
              </View>
            ) : null}

            {categoriesOpen && tagOptions.length > 1 ? (
              <View style={styles.filtersPanel}>
                <FieldLabel>Marcadores</FieldLabel>
                <PillSelector
                  options={tagOptions}
                  value={tagFilter}
                  onChange={setTagFilter}
                  getColor={(v) => (v === 'all' ? null : getTagColor(v))}
                />
              </View>
            ) : null}
          </>
        ) : null}
        </View>
      </View>

      {reorderMode ? (
        <>
          <Text style={styles.reorderHint}>
            {moveFromId ? 'Toca la casilla donde quieres soltarla.' : 'Toca una carta para levantarla.'}
          </Text>
          <FlatList
            style={styles.list}
            data={cards}
            keyExtractor={(item) => item.id}
            numColumns={numColumns}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <CardThumbnail
                card={item.card}
                price={item.ask_price}
                numColumns={numColumns}
                onPress={() => handleReorderTap(item)}
                selectionMode
                selected={item.id === moveFromId}
              />
            )}
          />
        </>
      ) : (
        <FlatList
          style={styles.list}
          data={filteredCards}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              message={
                cards.length > 0
                  ? 'Ninguna carta coincide con la búsqueda/filtro.'
                  : isOwner
                    ? 'Este binder todavía no tiene cartas. Usa el botón (+) para agregar.'
                    : 'Este binder todavía no tiene cartas.'
              }
            />
          }
          renderItem={({ item }) => (
            <CardThumbnail
              card={item.card}
              price={item.ask_price}
              numColumns={numColumns}
              onPress={() => handleCardPress(item)}
              onLongPress={() => handleCardLongPress(item)}
              onQuickSell={isOwner && !selectionMode ? () => handleQuickSell(item) : undefined}
              selectionMode={selectionMode}
              selected={!!selectedIds[item.id]}
              tagColor={getTagColor(item.notes)}
            />
          )}
        />
      )}

      {selectionMode ? (
        <View style={styles.bulkBar}>
          <Text style={styles.bulkCount}>{selectedCards.length} seleccionada(s)</Text>
          <View style={styles.bulkActions}>
            <Button
              title="Marcar vendidas"
              icon="cash-outline"
              variant="secondary"
              compact
              onPress={handleBulkSell}
              loading={bulkWorking}
              disabled={selectedCards.length === 0}
              style={styles.bulkButton}
            />
            <Button
              title="Eliminar"
              icon="trash-outline"
              variant="secondary"
              compact
              textColor={colors.danger}
              onPress={handleBulkDelete}
              loading={bulkWorking}
              disabled={selectedCards.length === 0}
              style={styles.bulkButton}
            />
          </View>
        </View>
      ) : fabActions && !reorderMode ? (
        <SpeedDialFab actions={fabActions} />
      ) : null}

      {!isOwner && showIntro ? (
        <BinderIntro
          type={binder?.intro_animation || 'fade'}
          title={binder?.title}
          username={binder?.owner?.username}
          themeColor={accentColor}
          cardCount={cards.length}
          onComplete={() => setShowIntro(false)}
        />
      ) : null}

      <SellQuantityModal
        visible={!!sellingCard}
        onClose={() => setSellingCard(null)}
        onConfirm={handleConfirmSellQuantity}
        cardName={sellingCard?.card?.name}
        maxQuantity={sellingCard?.quantity ?? 1}
        askPrice={sellingCard?.ask_price ?? 0}
        currency={currency}
      />

      <BulkSellModal
        visible={bulkSellModalOpen}
        onClose={() => setBulkSellModalOpen(false)}
        onConfirm={handleConfirmBulkSell}
        cards={selectedCards}
        currency={currency}
      />
    </View>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerWrap: {
    overflow: 'hidden',
  },
  accentBar: {
    height: 4,
    width: '100%',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  headerTopLeft: {
    flex: 1,
  },
  shareButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
    marginBottom: spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  ownerLine: {
    color: colors.primary,
    fontFamily: fonts.semibold,
    marginBottom: spacing.sm,
  },
  reorderHint: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.secondary,
  },
  filtersToggle: {
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  filtersToggleText: {
    color: colors.primary,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  filtersPanel: {
    marginBottom: spacing.md,
  },
  spacer: {
    height: spacing.sm,
  },
  list: {
    backgroundColor: 'transparent',
  },
  listContent: {
    padding: 8,
    paddingBottom: 110,
  },
  bulkBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.lg,
  },
  bulkCount: {
    fontFamily: fonts.semibold,
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  bulkActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bulkButton: {
    flex: 1,
  },
  });
}
