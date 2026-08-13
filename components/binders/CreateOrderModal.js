import { useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { createOrder } from '../../lib/orders';
import { formatPrice } from '../../lib/currency';
import Button from '../Button';
import { fonts, radius, spacing } from '../../theme';
import { useTheme } from '../../lib/ThemeContext';

// Mismo esqueleto que ReportUserModal: el modal arma la mutación él mismo
// (createOrder) y maneja su propio estado de envío/éxito/error.
export default function CreateOrderModal({ visible, onClose, onSuccess, binder, cards, currency }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const total = cards.reduce((sum, c) => sum + (c.ask_price ?? 0) * (c.quantity ?? 1), 0);

  async function handleSubmit() {
    setSending(true);
    setError(null);
    try {
      await createOrder(binder, cards);
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  function handleClose() {
    setSent(false);
    setError(null);
    onClose();
  }

  function handleDone() {
    setSent(false);
    setError(null);
    onSuccess();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {sent ? (
            <>
              <Text style={styles.title}>Pedido enviado</Text>
              <Text style={styles.hint}>El dueño del binder lo va a revisar y te avisa si lo acepta.</Text>
              <Button title="Listo" onPress={handleDone} style={styles.submitButton} />
            </>
          ) : (
            <>
              <Text style={styles.title}>Crear pedido</Text>
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
                      <Text style={styles.rowPrice}>
                        {formatPrice((card.ask_price ?? 0) * (card.quantity ?? 1), currency)}
                        {(card.quantity ?? 1) > 1 ? ` · x${card.quantity}` : ''}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>

              <Text style={styles.totalText}>Total: {formatPrice(total, currency)}</Text>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <View style={styles.actions}>
                <Button title="Cancelar" variant="secondary" onPress={handleClose} style={styles.actionButton} />
                <Button title="Enviar pedido" onPress={handleSubmit} loading={sending} style={styles.actionButton} />
              </View>
            </>
          )}
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
    totalText: {
      fontFamily: fonts.bold,
      fontSize: 15,
      color: colors.foreground,
      textAlign: 'center',
      marginTop: spacing.md,
    },
    error: {
      color: colors.danger,
      fontFamily: fonts.medium,
      fontSize: 12,
      textAlign: 'center',
      marginTop: spacing.sm,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    actionButton: {
      flex: 1,
    },
    submitButton: {
      marginTop: spacing.md,
    },
  });
}
