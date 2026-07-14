import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { updateBinderCard, removeCardFromBinder } from '../../lib/binderCards';
import { getMarketPrice, deriveMarketPriceFromRaw } from '../../lib/marketPrices';
import { getBinder } from '../../lib/binders';
import { useCurrency } from '../../lib/CurrencyContext';
import { convertPrice, formatPrice } from '../../lib/currency';
import { supabase } from '../../lib/supabase';
import { STATUS_LABEL, STATUS_COLOR, STATUS_OPTIONS } from '../../constants/cardStatus';
import { CONDITION_LABEL, CONDITION_OPTIONS, FINISH_LABEL, FINISH_OPTIONS, LANGUAGE_OPTIONS } from '../../constants/cardOptions';
import PillSelector from '../../components/PillSelector';
import TextField from '../../components/TextField';
import FieldLabel from '../../components/FieldLabel';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import { fonts, radius, spacing } from '../../theme';
import { useTheme } from '../../lib/ThemeContext';

export default function CardDetailScreen({ route, navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { binderCard } = route.params;
  const card = binderCard.card;
  const { currency } = useCurrency();

  // No confiamos en un "isOwner" que nos haya pasado la pantalla anterior por
  // route.params: eso puede quedar viejo si esa pantalla reutilizó su instancia
  // (ver el bug de BinderDetailScreen). Aquí verificamos la propiedad nosotros
  // mismos, contra la base de datos, cada vez que se abre esta pantalla.
  const [checkingOwner, setCheckingOwner] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [ownerWhatsapp, setOwnerWhatsapp] = useState(null);

  const [status, setStatus] = useState(binderCard.status);
  const [askPrice, setAskPrice] = useState(binderCard.ask_price != null ? String(binderCard.ask_price) : '');
  const [quantity, setQuantity] = useState(String(binderCard.quantity ?? 1));
  const [condition, setCondition] = useState(binderCard.condition);
  const [finish, setFinish] = useState(binderCard.finish);
  const [language, setLanguage] = useState(binderCard.language);
  const [tag, setTag] = useState(binderCard.notes || '');
  const [marketPrice, setMarketPrice] = useState(null);
  const [saving, setSaving] = useState(false);
  const [buyQuantity, setBuyQuantity] = useState(1);

  useEffect(() => {
    navigation.setOptions({ title: card.name });
  }, []);

  useEffect(() => {
    getMarketPrice(card.id).then((cached) => {
      if (cached?.market_price) {
        setMarketPrice(cached);
        return;
      }
      // La tabla `market_prices` (sincronizada por la web) todavía no tiene
      // esta carta — pasa seguido con cartas agregadas desde mobile. En vez
      // de quedarnos sin precio, lo reconstruimos del `raw` guardado al
      // agregar la carta.
      const derived = deriveMarketPriceFromRaw(card.game, card.raw);
      setMarketPrice(derived ? { market_price: derived } : null);
    });
  }, [card.id]);

  useEffect(() => {
    let active = true;
    setCheckingOwner(true);
    Promise.all([supabase.auth.getUser(), getBinder(binderCard.binder_id)]).then(
      ([{ data: { user } }, binder]) => {
        if (!active) return;
        setIsOwner(user.id === binder.owner_id);
        setOwnerWhatsapp(binder.owner?.whatsapp_e164 || null);
        setCheckingOwner(false);
      }
    );
    return () => {
      active = false;
    };
  }, [binderCard.id, binderCard.binder_id]);

  async function handleSave() {
    setSaving(true);
    try {
      await updateBinderCard(binderCard.id, {
        status,
        ask_price: askPrice ? parseFloat(askPrice) : null,
        quantity: Math.max(1, parseInt(quantity, 10) || 1),
        condition,
        finish,
        language,
        notes: tag.trim() || null,
      });
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    Alert.alert('Eliminar carta', `¿Quitar ${card.name} de este binder?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await removeCardFromBinder(binderCard.id);
          navigation.goBack();
        },
      },
    ]);
  }

  function handleWhatsApp() {
    const price = binderCard.ask_price ? formatPrice(binderCard.ask_price, currency) : 'Precio a consultar';
    const qtyText = buyQuantity > 1 ? `${buyQuantity} unidades` : '1 unidad';
    const message = `¡Hola! Vi tu ${card.name} (${card.set_name || ''}). Me interesan ${qtyText}. ¿Sigue disponible? ${price}`;
    const url = `https://wa.me/${ownerWhatsapp.replace('+', '')}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url);
  }

  if (checkingOwner) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const statusColor = STATUS_COLOR[binderCard.status];
  const maxQuantity = binderCard.quantity ?? 1;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {card.image_url ? (
        <Image source={{ uri: card.image_url }} style={styles.image} resizeMode="contain" />
      ) : null}

      <Text style={styles.name}>{card.name}</Text>
      <Text style={styles.set}>
        {card.set_name} {card.number ? `#${card.number}` : ''}
      </Text>

      {marketPrice?.market_price || binderCard.ask_price ? (
        <View style={styles.priceRow}>
          {marketPrice?.market_price ? (
            <View style={styles.priceCard}>
              <Ionicons name="trending-up-outline" size={16} color={colors.mutedForeground} />
              <Text style={styles.priceLabel}>Mercado</Text>
              <Text style={styles.priceValue}>
                {formatPrice(convertPrice(marketPrice.market_price, 'USD', currency), currency)}
              </Text>
            </View>
          ) : null}
          {binderCard.ask_price ? (
            <View style={[styles.priceCard, styles.priceCardSale]}>
              <Ionicons name="pricetag-outline" size={16} color={colors.secondary} />
              <Text style={styles.priceLabel}>Venta</Text>
              <Text style={[styles.priceValue, { color: colors.secondary }]}>
                {formatPrice(Number(binderCard.ask_price), currency)}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {isOwner ? (
        <View style={styles.section}>
          <View style={styles.formCard}>
            <FieldLabel>Estado</FieldLabel>
            <PillSelector options={STATUS_OPTIONS} value={status} onChange={setStatus} />

            <View style={styles.fieldSpacer} />
            <FieldLabel>Condición</FieldLabel>
            <PillSelector options={CONDITION_OPTIONS} value={condition} onChange={setCondition} />

            <View style={styles.fieldSpacer} />
            <FieldLabel>Finish</FieldLabel>
            <PillSelector options={FINISH_OPTIONS} value={finish} onChange={setFinish} />

            <View style={styles.fieldSpacer} />
            <FieldLabel>Idioma</FieldLabel>
            <PillSelector options={LANGUAGE_OPTIONS} value={language} onChange={setLanguage} />
          </View>

          <View style={styles.row}>
            <TextField
              label="Cantidad"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="number-pad"
              containerStyle={styles.halfField}
            />
            <TextField
              label={`Precio de venta (${currency})`}
              value={askPrice}
              onChangeText={setAskPrice}
              keyboardType="decimal-pad"
              placeholder="0.00"
              containerStyle={styles.halfField}
            />
          </View>

          <TextField
            label="Categoría / etiqueta (opcional)"
            value={tag}
            onChangeText={setTag}
            placeholder="Ej. Raras, Para vender, Set X"
          />

          <Button title="Guardar cambios" onPress={handleSave} loading={saving} style={styles.saveButton} />
          <TouchableOpacity onPress={confirmDelete} style={styles.deleteLink}>
            <Text style={styles.deleteLinkText}>Eliminar del binder</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.section}>
          <View style={styles.formCard}>
            <View style={styles.statusRow}>
              <Badge label={STATUS_LABEL[binderCard.status]} color={statusColor.color} backgroundColor={statusColor.backgroundColor} />
            </View>

            <View style={styles.infoGrid}>
              <View style={styles.infoChip}>
                <Ionicons name="globe-outline" size={16} color={colors.primary} />
                <Text style={styles.infoChipLabel}>Idioma</Text>
                <Text style={styles.infoChipValue}>{binderCard.language}</Text>
              </View>
              <View style={styles.infoChip}>
                <Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />
                <Text style={styles.infoChipLabel}>Condición</Text>
                <Text style={styles.infoChipValue}>{CONDITION_LABEL[binderCard.condition]}</Text>
              </View>
              <View style={styles.infoChip}>
                <Ionicons name="sparkles-outline" size={16} color={colors.primary} />
                <Text style={styles.infoChipLabel}>Finish</Text>
                <Text style={styles.infoChipValue}>{FINISH_LABEL[binderCard.finish]}</Text>
              </View>
              <View style={styles.infoChip}>
                <Ionicons name="layers-outline" size={16} color={colors.primary} />
                <Text style={styles.infoChipLabel}>Disponibles</Text>
                <Text style={styles.infoChipValue}>{maxQuantity}</Text>
              </View>
            </View>
          </View>

          {binderCard.status === 'sale' && ownerWhatsapp ? (
            <>
              {maxQuantity > 1 ? (
                <View style={styles.stepperRow}>
                  <TouchableOpacity
                    style={styles.stepperButton}
                    onPress={() => setBuyQuantity((q) => Math.max(1, q - 1))}
                  >
                    <Text style={styles.stepperSymbol}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepperValue}>{buyQuantity}</Text>
                  <TouchableOpacity
                    style={styles.stepperButton}
                    onPress={() => setBuyQuantity((q) => Math.min(maxQuantity, q + 1))}
                  >
                    <Text style={styles.stepperSymbol}>+</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              <Button
                title="Contactar por WhatsApp"
                icon="logo-whatsapp"
                onPress={handleWhatsApp}
                style={styles.waButton}
                textColor="#fff"
              />
            </>
          ) : null}
        </View>
      )}
    </ScrollView>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
  container: {
    padding: spacing.lg,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  image: {
    width: 220,
    aspectRatio: 63 / 88,
    borderRadius: radius.md,
    backgroundColor: colors.muted,
  },
  name: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.foreground,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  set: {
    fontFamily: fonts.regular,
    color: colors.mutedForeground,
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    width: '100%',
  },
  priceCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    gap: 2,
  },
  priceCardSale: {
    borderColor: colors.secondary,
  },
  priceLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  priceValue: {
    fontFamily: fonts.extrabold,
    fontSize: 16,
    color: colors.foreground,
  },
  section: {
    width: '100%',
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  formCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  fieldSpacer: {
    height: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: spacing.lg,
  },
  halfField: {
    width: '48%',
    marginBottom: spacing.md,
  },
  saveButton: {
    width: '100%',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  deleteLink: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  deleteLinkText: {
    color: colors.danger,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  waButton: {
    width: '100%',
    backgroundColor: colors.whatsapp,
    marginTop: spacing.lg,
  },
  statusRow: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  infoChip: {
    width: '47%',
    alignItems: 'center',
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    gap: 2,
  },
  infoChipLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  infoChipValue: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.foreground,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.lg,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperSymbol: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.foreground,
  },
  stepperValue: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.foreground,
    minWidth: 24,
    textAlign: 'center',
  },
  });
}
