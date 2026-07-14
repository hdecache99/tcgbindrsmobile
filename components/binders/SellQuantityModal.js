import { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatPrice } from '../../lib/currency';
import Button from '../Button';
import { fonts, radius, spacing } from '../../theme';
import { useTheme } from '../../lib/ThemeContext';

// Cuando hay más de una copia de la misma carta, vender no siempre es "vender
// todas" — puede que solo se haya vendido 1 de 3. Este modal pregunta cuántas
// antes de confirmar, en vez de asumir que se vendió el lote completo.
export default function SellQuantityModal({ visible, onClose, onConfirm, cardName, maxQuantity, askPrice, currency }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [quantity, setQuantity] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setQuantity(1);
      setSaving(false);
    }
  }, [visible]);

  async function handleConfirm() {
    setSaving(true);
    try {
      await onConfirm(quantity);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Marcar como vendida</Text>
          <Text style={styles.hint}>
            Tienes {maxQuantity} copias de &quot;{cardName}&quot;. ¿Cuántas vendiste?
          </Text>

          <View style={styles.stepperRow}>
            <TouchableOpacity style={styles.stepperButton} onPress={() => setQuantity((q) => Math.max(1, q - 1))}>
              <Text style={styles.stepperSymbol}>−</Text>
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{quantity}</Text>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
            >
              <Text style={styles.stepperSymbol}>+</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.totalText}>Total de la venta: {formatPrice((askPrice ?? 0) * quantity, currency)}</Text>

          {quantity < maxQuantity ? (
            <Text style={styles.remainingText}>
              Las {maxQuantity - quantity} copia(s) restantes se quedan en el binder.
            </Text>
          ) : null}

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
    },
    title: {
      fontFamily: fonts.bold,
      fontSize: 16,
      color: colors.foreground,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    hint: {
      fontFamily: fonts.regular,
      color: colors.mutedForeground,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    stepperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.lg,
    },
    stepperButton: {
      width: 40,
      height: 40,
      borderRadius: radius.pill,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepperSymbol: {
      fontFamily: fonts.bold,
      fontSize: 20,
      color: colors.foreground,
    },
    stepperValue: {
      fontFamily: fonts.bold,
      fontSize: 22,
      color: colors.foreground,
      minWidth: 32,
      textAlign: 'center',
    },
    totalText: {
      fontFamily: fonts.bold,
      fontSize: 15,
      color: colors.foreground,
      textAlign: 'center',
      marginTop: spacing.lg,
    },
    remainingText: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: colors.mutedForeground,
      textAlign: 'center',
      marginTop: spacing.xs,
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
