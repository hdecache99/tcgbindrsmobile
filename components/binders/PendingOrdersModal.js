import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { acceptOrder, getPendingOrders, rejectOrder } from '../../lib/orders';
import Button from '../Button';
import { fonts, radius, spacing } from '../../theme';
import { useTheme } from '../../lib/ThemeContext';

// Lista los pedidos pendientes de este binder para que el dueño los acepte o
// rechace. Al aceptar, acceptOrder ya descuenta el inventario y registra la
// venta (ver lib/orders.js) — acá solo reflejamos el resultado en la lista.
export default function PendingOrdersModal({ visible, onClose, binderId, currency, onCountChange, onAccepted }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState(null);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    getPendingOrders(binderId)
      .then(setOrders)
      .finally(() => setLoading(false));
  }, [visible, binderId]);

  function removeOrder(orderId) {
    setOrders((prev) => {
      const next = prev.filter((o) => o.id !== orderId);
      onCountChange(next.length);
      return next;
    });
  }

  async function handleAccept(order) {
    setWorkingId(order.id);
    try {
      await acceptOrder(order, currency);
      removeOrder(order.id);
      onAccepted();
    } finally {
      setWorkingId(null);
    }
  }

  async function handleReject(order) {
    setWorkingId(order.id);
    try {
      await rejectOrder(order.id);
      removeOrder(order.id);
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Pedidos pendientes</Text>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={styles.spinner} />
          ) : orders.length === 0 ? (
            <Text style={styles.hint}>No tenés pedidos pendientes.</Text>
          ) : (
            <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
              {orders.map((order) => (
                <View key={order.id} style={styles.orderCard}>
                  <Text style={styles.buyerName}>@{order.buyer_username}</Text>
                  <Text style={styles.orderDate}>
                    {new Date(order.created_at).toLocaleDateString()}
                  </Text>

                  <View style={styles.itemsList}>
                    {order.items.map((item, i) => (
                      <Text key={i} style={styles.itemLine} numberOfLines={1}>
                        {item.card_name} {item.quantity > 1 ? `x${item.quantity}` : ''}
                      </Text>
                    ))}
                  </View>

                  <View style={styles.actions}>
                    <Button
                      title="Rechazar"
                      variant="secondary"
                      compact
                      textColor={colors.danger}
                      onPress={() => handleReject(order)}
                      loading={workingId === order.id}
                      disabled={workingId === order.id}
                      style={styles.actionButton}
                    />
                    <Button
                      title="Aceptar"
                      compact
                      onPress={() => handleAccept(order)}
                      loading={workingId === order.id}
                      disabled={workingId === order.id}
                      style={styles.actionButton}
                    />
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          <Button title="Cerrar" variant="secondary" onPress={onClose} style={styles.closeButton} />
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
      marginBottom: spacing.md,
    },
    hint: {
      fontFamily: fonts.regular,
      color: colors.mutedForeground,
      textAlign: 'center',
      paddingVertical: spacing.lg,
    },
    spinner: {
      paddingVertical: spacing.lg,
    },
    list: {
      maxHeight: 400,
    },
    listContent: {
      gap: spacing.sm,
    },
    orderCard: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    buyerName: {
      fontFamily: fonts.bold,
      fontSize: 14,
      color: colors.foreground,
    },
    orderDate: {
      fontFamily: fonts.regular,
      fontSize: 11,
      color: colors.mutedForeground,
      marginTop: 1,
    },
    itemsList: {
      marginTop: spacing.sm,
      gap: 2,
    },
    itemLine: {
      fontFamily: fonts.medium,
      fontSize: 12,
      color: colors.foreground,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    actionButton: {
      flex: 1,
    },
    closeButton: {
      marginTop: spacing.md,
    },
  });
}
