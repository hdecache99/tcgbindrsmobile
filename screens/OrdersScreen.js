import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { acceptOrder, getAllPendingOrders, rejectOrder } from '../lib/orders';
import { useCurrency } from '../lib/CurrencyContext';
import AppHeader from '../components/AppHeader';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import { fonts, radius, spacing } from '../theme';
import { useTheme } from '../lib/ThemeContext';

// Bandeja global: junta los pedidos pendientes de TODOS los binders del
// usuario logueado, para no tener que entrar binder por binder a revisarlos
// (ese acceso puntual sigue existiendo — botón "Pedidos" en BinderDetailScreen).
export default function OrdersScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { currency } = useCurrency();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState(null);

  const load = useCallback(async () => {
    const data = await getAllPendingOrders();
    setOrders(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [load])
  );

  function removeOrder(orderId) {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  }

  async function handleAccept(order) {
    setWorkingId(order.id);
    try {
      await acceptOrder(order, currency);
      removeOrder(order.id);
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

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader navigation={navigation} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader navigation={navigation} />
      <ScrollView contentContainerStyle={styles.listContent}>
        <Text style={styles.title}>Pedidos pendientes</Text>

        {orders.length === 0 ? (
          <EmptyState message="No tenés pedidos pendientes en ninguno de tus binders." />
        ) : (
          orders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('BinderDetail', { binderId: order.binder_id, title: order.binder_title })
                }
              >
                <Text style={styles.binderTitle}>{order.binder_title}</Text>
              </TouchableOpacity>
              <Text style={styles.buyerName}>@{order.buyer_username}</Text>
              <Text style={styles.orderDate}>{new Date(order.created_at).toLocaleDateString()}</Text>

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
          ))
        )}
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
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    listContent: {
      padding: spacing.lg,
      paddingBottom: spacing.xl,
    },
    title: {
      fontFamily: fonts.bold,
      fontSize: 20,
      color: colors.foreground,
      marginBottom: spacing.md,
    },
    orderCard: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      backgroundColor: colors.card,
    },
    binderTitle: {
      fontFamily: fonts.bold,
      fontSize: 15,
      color: colors.primary,
    },
    buyerName: {
      fontFamily: fonts.semibold,
      fontSize: 13,
      color: colors.foreground,
      marginTop: 2,
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
  });
}
