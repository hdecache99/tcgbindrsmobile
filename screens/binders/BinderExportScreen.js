import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getBinderCards } from '../../lib/binders';
import { exportBinderPdf, exportBinderCsv } from '../../lib/binderExport';
import { useCurrency } from '../../lib/CurrencyContext';
import Button from '../../components/Button';
import ErrorText from '../../components/ErrorText';
import { fonts, radius, spacing } from '../../theme';
import { useTheme } from '../../lib/ThemeContext';

export default function BinderExportScreen({ route }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { binder } = route.params;
  const { currency } = useCurrency();
  const [working, setWorking] = useState(null);
  const [error, setError] = useState(null);

  async function handleExport(kind) {
    setWorking(kind);
    setError(null);
    try {
      const cards = await getBinderCards(binder.id);
      if (kind === 'pdf') {
        await exportBinderPdf(binder, cards, currency);
      } else {
        await exportBinderCsv(binder, cards);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setWorking(null);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Exportar "{binder.title}"</Text>
      <Text style={styles.hint}>Genera un archivo con todas las cartas del binder para compartir o guardar.</Text>

      <ErrorText>{error}</ErrorText>

      <View style={styles.option}>
        <View style={styles.optionTitleRow}>
          <Ionicons name="document-text-outline" size={18} color={colors.foreground} style={styles.optionIcon} />
          <Text style={styles.optionTitle}>Índice visual (PDF)</Text>
        </View>
        <Text style={styles.optionDescription}>Grid con la imagen, nombre y precio de cada carta — listo para imprimir.</Text>
        <Button title="Exportar PDF" onPress={() => handleExport('pdf')} loading={working === 'pdf'} disabled={!!working} />
      </View>

      <View style={styles.option}>
        <View style={styles.optionTitleRow}>
          <Ionicons name="grid-outline" size={18} color={colors.foreground} style={styles.optionIcon} />
          <Text style={styles.optionTitle}>Hoja de cálculo (CSV)</Text>
        </View>
        <Text style={styles.optionDescription}>Tabla con nombre, expansión, condición, cantidad y precio — para abrir en Excel/Sheets.</Text>
        <Button
          title="Exportar CSV"
          variant="secondary"
          onPress={() => handleExport('csv')}
          loading={working === 'csv'}
          disabled={!!working}
        />
      </View>
    </View>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  title: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.foreground,
  },
  hint: {
    fontFamily: fonts.regular,
    color: colors.mutedForeground,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  option: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  optionIcon: {
    marginRight: 6,
  },
  optionTitle: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.foreground,
  },
  optionDescription: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.mutedForeground,
    marginBottom: spacing.md,
  },
  });
}
