import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCurrency } from '../../lib/CurrencyContext';
import { convertPrice, formatPrice } from '../../lib/currency';
import { fonts, radius, spacing } from '../../theme';
import { useTheme } from '../../lib/ThemeContext';

// Fila de una variante candidata dentro del picker del escáner — misma
// estructura visual que ScannedCardItem pero sin checkbox, ya que tocarla
// directamente la elige.
export default function VariantListItem({ card, onPress }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { currency } = useCurrency();

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
          {card.set_name} {card.number ? `#${card.number}` : ''}
        </Text>
        {card.price?.market ? (
          <Text style={styles.price}>{formatPrice(convertPrice(card.price.market, 'USD', currency), currency)}</Text>
        ) : null}
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
  price: {
    fontFamily: fonts.semibold,
    color: colors.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  });
}
