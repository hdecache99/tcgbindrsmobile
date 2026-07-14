import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCurrency } from '../../lib/CurrencyContext';
import { convertPrice, formatPrice } from '../../lib/currency';
import { fonts, radius, spacing } from '../../theme';
import { useTheme } from '../../lib/ThemeContext';

export default function ScannedCardItem({ scanned, selected, onToggle, onChangeCard }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { currency } = useCurrency();
  const { detection, match } = scanned;
  const found = !!match;

  return (
    <View style={[styles.row, !found && styles.rowDisabled]}>
      <TouchableOpacity style={styles.tapArea} onPress={found ? onToggle : undefined} disabled={!found}>
        {match?.image_url_small ? (
          <Image source={{ uri: match.image_url_small }} style={styles.image} resizeMode="contain" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]} />
        )}

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {detection.name}
          </Text>
          <Text style={styles.set} numberOfLines={1}>
            {found ? `${match.set_name || ''} ${match.number ? `#${match.number}` : ''}` : 'No encontrada — omitida'}
          </Text>
          {match?.price?.market ? (
            <Text style={styles.price}>{formatPrice(convertPrice(match.price.market, 'USD', currency), currency)}</Text>
          ) : null}
        </View>

        {found ? (
          <View style={[styles.checkbox, selected && styles.checkboxChecked]}>
            {selected ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
          </View>
        ) : null}
      </TouchableOpacity>

      {onChangeCard ? (
        <TouchableOpacity style={styles.changeLink} onPress={onChangeCard}>
          <Ionicons name="sync-outline" size={13} color={colors.primary} style={styles.changeLinkIcon} />
          <Text style={styles.changeLinkText}>¿No es esta carta? Elegir otra</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
  row: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  tapArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeLink: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeLinkIcon: {
    marginRight: 4,
  },
  changeLinkText: {
    color: colors.primary,
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  image: {
    width: 44,
    height: 61,
    borderRadius: 4,
    backgroundColor: colors.muted,
  },
  imagePlaceholder: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    fontFamily: fonts.semibold,
    color: colors.foreground,
    fontSize: 14,
  },
  set: {
    fontFamily: fonts.regular,
    color: colors.mutedForeground,
    fontSize: 12,
    marginTop: 2,
  },
  price: {
    fontFamily: fonts.semibold,
    color: colors.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  });
}
