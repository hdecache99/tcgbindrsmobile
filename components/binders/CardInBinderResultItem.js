import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCurrency } from '../../lib/CurrencyContext';
import { formatPrice } from '../../lib/currency';
import { fonts, radius, spacing } from '../../theme';
import { useTheme } from '../../lib/ThemeContext';

export default function CardInBinderResultItem({ result, onPress }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { currency } = useCurrency();
  const { card, binder, ask_price, status } = result;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      {card.image_url_small ? (
        <Image source={{ uri: card.image_url_small }} style={styles.image} resizeMode="contain" />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]} />
      )}

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {card.name}
        </Text>
        <Text style={styles.set} numberOfLines={1}>
          {card.set_name}
        </Text>
        <Text style={styles.owner} numberOfLines={1}>
          en "{binder.title}" de @{binder.owner?.username}
        </Text>
        {status === 'sale' && ask_price ? <Text style={styles.price}>{formatPrice(ask_price, currency)}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
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
  owner: {
    fontFamily: fonts.medium,
    color: colors.primary,
    fontSize: 11,
    marginTop: 2,
  },
  price: {
    fontFamily: fonts.semibold,
    color: colors.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  });
}
