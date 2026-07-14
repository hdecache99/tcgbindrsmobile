import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { getSalesInsights, updateSale, deleteSale } from '../lib/sales';
import { useCurrency } from '../lib/CurrencyContext';
import { formatPrice } from '../lib/currency';
import { CONDITION_OPTIONS } from '../constants/cardOptions';
import AppHeader from '../components/AppHeader';
import AdBanner from '../components/AdBanner';
import PillSelector from '../components/PillSelector';
import TextField from '../components/TextField';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import { fonts, radius, spacing } from '../theme';
import { useTheme } from '../lib/ThemeContext';

const CONDITION_FILTER_OPTIONS = [{ value: 'all', label: 'Todas' }, ...CONDITION_OPTIONS];
const DATE_FILTER_OPTIONS = [
  { value: 'all', label: 'Todas' },
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'prev_month', label: 'Mes anterior' },
];

function csvEscape(value) {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function dayKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export default function SalesScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { currency } = useCurrency();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [editData, setEditData] = useState({ salePrice: '', extras: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const data = await getSalesInsights();
    setSales(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [load])
  );

  const fmt = (v) => formatPrice(Number(v) || 0, currency);

  const filtered = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    return sales.filter((s) => {
      if (search.trim() && !s.card?.name?.toLowerCase().includes(search.trim().toLowerCase())) return false;
      if (conditionFilter !== 'all' && s.condition !== conditionFilter) return false;

      if (dateFilter !== 'all') {
        const d = new Date(s.sold_at);
        if (dateFilter === 'today' && d < todayStart) return false;
        if (dateFilter === 'week' && d < weekStart) return false;
        if (dateFilter === 'month' && d < monthStart) return false;
        if (dateFilter === 'prev_month' && (d < prevMonthStart || d > prevMonthEnd)) return false;
      }
      return true;
    });
  }, [sales, search, conditionFilter, dateFilter]);

  const groupedByDay = useMemo(() => {
    const map = new Map();
    filtered.forEach((s) => {
      const d = new Date(s.sold_at);
      const key = dayKey(d);
      if (!map.has(key)) {
        map.set(key, {
          key,
          label: d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
          items: [],
          dayTotal: 0,
        });
      }
      const g = map.get(key);
      g.items.push(s);
      g.dayTotal += Number(s.sale_price) * Number(s.quantity) + Number(s.extras || 0);
    });
    return Array.from(map.values());
  }, [filtered]);

  const totalSold = filtered.reduce((sum, s) => sum + Number(s.quantity), 0);
  const totalRevenue = filtered.reduce((sum, s) => sum + Number(s.sale_price) * Number(s.quantity), 0);
  const totalExtras = filtered.reduce((sum, s) => sum + Number(s.extras || 0), 0);
  const avgPrice = totalSold > 0 ? totalRevenue / totalSold : 0;
  const netTotal = totalRevenue + totalExtras;

  function openExpand(sale) {
    if (expandedId === sale.id) {
      setExpandedId(null);
      return;
    }
    setEditData({ salePrice: String(sale.sale_price), extras: String(sale.extras || 0), notes: sale.notes || '' });
    setExpandedId(sale.id);
  }

  async function handleSave(saleId) {
    setSaving(true);
    try {
      const updated = await updateSale(saleId, {
        sale_price: parseFloat(editData.salePrice) || 0,
        extras: parseFloat(editData.extras) || 0,
        notes: editData.notes || null,
      });
      setSales((prev) => prev.map((s) => (s.id === saleId ? { ...s, ...updated } : s)));
      setExpandedId(null);
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(saleId) {
    Alert.alert('Eliminar venta', '¿Eliminar este registro de venta? Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await deleteSale(saleId);
          setSales((prev) => prev.filter((s) => s.id !== saleId));
        },
      },
    ]);
  }

  async function handleExport() {
    const header = ['Fecha', 'Carta', 'Cantidad', 'Precio', 'Extras', 'Total', 'Moneda', 'Condición', 'Notas'];
    const rows = sales.map((s) => [
      new Date(s.sold_at).toLocaleDateString(),
      s.card?.name,
      s.quantity,
      s.sale_price,
      s.extras || 0,
      Number(s.sale_price) * Number(s.quantity) + Number(s.extras || 0),
      s.currency || currency,
      s.condition,
      s.notes || '',
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');

    const file = new File(Paths.cache, `ventas_${new Date().toISOString().split('T')[0]}.csv`);
    file.create({ overwrite: true });
    file.write(csv);
    await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: 'Exportar ventas' });
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

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.totalLabel}>Total vendido</Text>
            <Text style={styles.totalValue}>{fmt(netTotal)}</Text>
          </View>
          <Button
            title="Exportar"
            icon="download-outline"
            variant="secondary"
            compact
            onPress={handleExport}
            disabled={sales.length === 0}
          />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Vendidas</Text>
            <Text style={styles.statValue}>{totalSold}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Extras</Text>
            <Text style={styles.statValue}>{fmt(totalExtras)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Promedio</Text>
            <Text style={styles.statValue}>{fmt(avgPrice)}</Text>
          </View>
        </View>

        <TextField placeholder="Buscar carta..." value={search} onChangeText={setSearch} />

        <PillSelector options={CONDITION_FILTER_OPTIONS} value={conditionFilter} onChange={setConditionFilter} />
        <View style={styles.spacer} />
        <PillSelector options={DATE_FILTER_OPTIONS} value={dateFilter} onChange={setDateFilter} />

        <View style={styles.spacerLg} />

        {groupedByDay.length === 0 ? (
          <EmptyState message={sales.length === 0 ? 'Todavía no has vendido ninguna carta.' : 'Ninguna venta coincide con el filtro.'} />
        ) : (
          groupedByDay.map((group) => (
            <View key={group.key} style={styles.dayGroup}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayLabel}>{group.label}</Text>
                <Text style={styles.dayTotal}>{fmt(group.dayTotal)}</Text>
              </View>

              {group.items.map((sale) => {
                const gross = Number(sale.sale_price) * Number(sale.quantity);
                const extras = Number(sale.extras || 0);
                const net = gross + extras;
                const isOpen = expandedId === sale.id;

                return (
                  <View key={sale.id} style={[styles.saleCard, isOpen && styles.saleCardOpen]}>
                    <View style={styles.saleRow}>
                      {sale.card?.image_url_small ? (
                        <Image source={{ uri: sale.card.image_url_small }} style={styles.saleImage} resizeMode="contain" />
                      ) : (
                        <View style={[styles.saleImage, styles.saleImagePlaceholder]} />
                      )}

                      <View style={styles.saleInfo}>
                        <Text style={styles.saleName} numberOfLines={1}>
                          {sale.card?.name || 'Desconocida'}
                        </Text>
                        <View style={styles.saleBadges}>
                          {sale.condition ? (
                            <View style={styles.badge}>
                              <Text style={styles.badgeText}>{sale.condition}</Text>
                            </View>
                          ) : null}
                          {sale.quantity > 1 ? (
                            <View style={styles.badge}>
                              <Text style={styles.badgeText}>×{sale.quantity}</Text>
                            </View>
                          ) : null}
                        </View>
                        {extras !== 0 ? (
                          <Text style={[styles.extrasText, { color: extras > 0 ? colors.secondary : colors.danger }]}>
                            {extras > 0 ? '+' : ''}
                            {fmt(Math.abs(extras))} extra
                          </Text>
                        ) : null}
                      </View>

                      <View style={styles.saleActions}>
                        <Text style={styles.saleNet}>{fmt(net)}</Text>
                        <View style={styles.saleActionButtons}>
                          <TouchableOpacity style={styles.iconButton} onPress={() => openExpand(sale)}>
                            <Ionicons
                              name={isOpen ? 'chevron-up' : 'chevron-down'}
                              size={16}
                              color={colors.primary}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.iconButton} onPress={() => confirmDelete(sale.id)}>
                            <Ionicons name="trash-outline" size={16} color={colors.danger} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>

                    {isOpen ? (
                      <View style={styles.editPanel}>
                        <TextField
                          label="Precio de venta"
                          keyboardType="decimal-pad"
                          value={editData.salePrice}
                          onChangeText={(v) => setEditData((p) => ({ ...p, salePrice: v }))}
                        />
                        <TextField
                          label="Extras (+/-)"
                          keyboardType="numbers-and-punctuation"
                          value={editData.extras}
                          onChangeText={(v) => setEditData((p) => ({ ...p, extras: v }))}
                        />
                        <TextField
                          label="Notas"
                          multiline
                          value={editData.notes}
                          onChangeText={(v) => setEditData((p) => ({ ...p, notes: v }))}
                        />
                        <View style={styles.editActions}>
                          <Button
                            title="Cancelar"
                            variant="secondary"
                            compact
                            onPress={() => setExpandedId(null)}
                            style={styles.editButton}
                          />
                          <Button
                            title="Guardar"
                            compact
                            loading={saving}
                            onPress={() => handleSave(sale.id)}
                            style={styles.editButton}
                          />
                        </View>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>

      <AdBanner />
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
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.xl,
    },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: spacing.lg,
    },
    totalLabel: {
      fontFamily: fonts.semibold,
      fontSize: 11,
      color: colors.mutedForeground,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    totalValue: {
      fontFamily: fonts.extrabold,
      fontSize: 28,
      color: colors.foreground,
    },
    statsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    statCard: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: spacing.sm,
    },
    statLabel: {
      fontFamily: fonts.medium,
      fontSize: 10,
      color: colors.mutedForeground,
      textTransform: 'uppercase',
    },
    statValue: {
      fontFamily: fonts.bold,
      fontSize: 15,
      color: colors.foreground,
      marginTop: 2,
    },
    spacer: {
      height: spacing.sm,
    },
    spacerLg: {
      height: spacing.lg,
    },
    dayGroup: {
      marginBottom: spacing.lg,
    },
    dayHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    dayLabel: {
      fontFamily: fonts.bold,
      fontSize: 12,
      color: colors.primary,
      textTransform: 'capitalize',
      flex: 1,
    },
    dayTotal: {
      fontFamily: fonts.bold,
      fontSize: 12,
      color: colors.secondary,
    },
    saleCard: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.sm,
      overflow: 'hidden',
    },
    saleCardOpen: {
      borderColor: colors.primary,
    },
    saleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.sm,
    },
    saleImage: {
      width: 40,
      height: 56,
      borderRadius: 4,
      backgroundColor: colors.muted,
    },
    saleImagePlaceholder: {
      borderWidth: 1,
      borderColor: colors.border,
    },
    saleInfo: {
      flex: 1,
      marginLeft: spacing.md,
    },
    saleName: {
      fontFamily: fonts.semibold,
      fontSize: 14,
      color: colors.foreground,
    },
    saleBadges: {
      flexDirection: 'row',
      gap: 4,
      marginTop: 4,
    },
    badge: {
      backgroundColor: colors.muted,
      borderRadius: radius.pill,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    badgeText: {
      fontFamily: fonts.semibold,
      fontSize: 10,
      color: colors.primary,
    },
    extrasText: {
      fontFamily: fonts.semibold,
      fontSize: 11,
      marginTop: 4,
    },
    saleActions: {
      alignItems: 'flex-end',
      marginLeft: spacing.sm,
    },
    saleNet: {
      fontFamily: fonts.extrabold,
      fontSize: 16,
      color: colors.secondary,
    },
    saleActionButtons: {
      flexDirection: 'row',
      gap: 4,
      marginTop: 6,
    },
    iconButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.muted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    editPanel: {
      padding: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    editActions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    editButton: {
      flex: 1,
    },
  });
}
