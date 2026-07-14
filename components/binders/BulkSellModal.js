import { useEffect, useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatPrice } from '../../lib/currency';
import Button from '../Button';
import { fonts, radius, spacing } from '../../theme';
import { useTheme } from '../../lib/ThemeContext';

// Igual que SellQuantityModal pero para varias cartas a la vez (selección
// múltiple): cada carta con más de 1 copia trae su propio stepper, para no
// asumir que "vender en masa" significa vender el lote completo de todas.
export default function BulkSellModal({ visible, onClose, onConfirm, cards, currency }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [quantities, setQuantities] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      const defaults = {};
      cards.forEach((c) => {
        defaults[c.id] = c.quantity ?? 1;
      });
      setQuantities(defaults);
      setSaving(false);
    }
  }, [visible]);

  function qtyFor(card) {
    return quantities[card.id] ?? card.quantity ?? 1;
  }

  function setQty(card, nextQty) {
    const max = card.quantity ?? 1;
    setQuantities((prev) => ({ ...prev, [card.id]: Math.max(1, Math.min(max, nextQty)) }));
  }

  const total = cards.reduce((sum, c) => sum + (c.ask_price ?? 0) * qtyFor(c), 0);

  async function handleConfirm() {
    setSaving(true);
    try {
      await onConfirm(quantities);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Marcar como vendidas</Text>
          <Text style={styles.hint}>{cards.length} carta(s) seleccionadas</Text>

          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {cards.map((card) => (
              <View key={card.id} style={styles.row}>
                {card.card?.image_url_small ? (
                  <Image source={{ uri: card.card.image_url_small }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.thumbPlaceholder]} />
                )}
                <View style={styles.rowInfo}>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {card.card?.name}
                  </Text>
                  <Text style={styles.rowPrice}>{formatPrice((card.ask_price ?? 0) * qtyFor(card), currency)}</Text>
                </View>
                {(card.quantity ?? 1) > 1 ? (
                  <View style={styles.stepperRow}>
                    <TouchableOpacity style={styles.stepperButton} onPress={() => setQty(card, qtyFor(card) - 1)}>
                      <Text style={styles.stepperSymbol}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.stepperValue}>{qtyFor(card)}</Text>
                    <TouchableOpacity style={styles.stepperButton} onPress={() => setQty(card, qtyFor(card) + 1)}>
                      <Text style={styles.stepperSymbol}>+</Text>
                    </TouchableOpacity>
                    <Text style={styles.maxText}>/{card.quantity}</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </ScrollView>

          <Text style={styles.totalText}>Total: {formatPrice(total, currency)}</Text>

          <View style={styles.actions}>
            <Button title="Cancelar" variant="secondary" onPress={onClose} style={styles.actionButton} />
            <Button title="Confirmar venta" onPress={handleConfirm} loading={saving} style={styles.actionButton} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      padding: spacing.lg,
      paddingBottom: spacing.xl,
      maxHeight: '85%',
    },
    title: {
      fontFamily: fonts.bold,
      fontSize: 16,
      color: colors.foreground,
      textAlign: 'center',
    },
    hint: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: colors.mutedForeground,
      textAlign: 'center',
      marginTop: 2,
      marginBottom: spacing.md,
    },
    list: {
      maxHeight: 320,
    },
    listContent: {
      gap: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    thumb: {
      width: 34,
      height: 46,
      borderRadius: radius.sm,
    },
    thumbPlaceholder: {
      backgroundColor: colors.muted,
    },
    rowInfo: {
      flex: 1,
      minWidth: 0,
    },
    rowName: {
      fontFamily: fonts.bold,
      fontSize: 13,
      color: colors.foreground,
    },
    rowPrice: {
      fontFamily: fonts.medium,
      fontSize: 12,
      color: colors.primary,
      marginTop: 2,
    },
    stepperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    stepperButton: {
      width: 26,
      height: 26,
      borderRadius: radius.pill,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepperSymbol: {
      fontFamily: fonts.bold,
      fontSize: 14,
      color: colors.foreground,
    },
    stepperValue: {
      fontFamily: fonts.bold,
      fontSize: 14,
      color: colors.foreground,
      minWidth: 18,
      textAlign: 'center',
    },
    maxText: {
      fontFamily: fonts.regular,
      fontSize: 11,
      color: colors.mutedForeground,
    },
    totalText: {
      fontFamily: fonts.bold,
      fontSize: 15,
      color: colors.foreground,
      textAlign: 'center',
      marginTop: spacing.md,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    actionButton: {
      flex: 1,
    },
  });
}
