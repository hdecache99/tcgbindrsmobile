import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useCurrency } from '../../lib/CurrencyContext';
import { formatPrice } from '../../lib/currency';
import { fonts, radius } from '../../theme';
import { useTheme } from '../../lib/ThemeContext';

// `price` siempre debe venir ya en la moneda del usuario (quien llama a este
// componente convierte antes con `convertPrice` si el valor viene crudo en USD
// de una API externa) — aquí solo se formatea con el símbolo correspondiente.
export default function CardThumbnail({
  card,
  price,
  numColumns,
  onPress,
  onLongPress,
  onQuickSell,
  added,
  selectionMode,
  selected,
  quantity,
  tagColor,
}) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { currency } = useCurrency();
  const hasPrice = price != null && price !== '';

  return (
    <TouchableOpacity
      testID="card-thumbnail"
      style={[styles.slot, { flex: 1 / numColumns }]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.imageFrame, selected && styles.imageFrameSelected]}>
        {card?.image_url_small ? (
          <Image source={{ uri: card.image_url_small }} style={styles.image} resizeMode="contain" />
        ) : (
          <View style={[styles.image, styles.placeholder]} />
        )}

        {card?.set_icon_url ? (
          <View style={styles.setIconBadge}>
            <Image source={{ uri: card.set_icon_url }} style={styles.setIcon} resizeMode="contain" />
          </View>
        ) : null}

        {hasPrice ? (
          <View style={styles.priceOverlay} pointerEvents="none">
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.75)']}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.priceText} numberOfLines={1}>
              {formatPrice(Number(price), currency)}
            </Text>
          </View>
        ) : null}

        {tagColor ? <View style={[styles.tagDot, { backgroundColor: tagColor }]} /> : null}

        {added ? (
          <View style={[styles.checkBadge, styles.checkBadgeDone]}>
            <Ionicons name="checkmark" size={13} color="#fff" />
          </View>
        ) : selectionMode && selected ? (
          <View style={[styles.checkBadge, styles.checkBadgeChecked]}>
            {quantity > 1 ? (
              <Text style={styles.checkIcon}>{quantity}</Text>
            ) : (
              <Ionicons name="checkmark" size={13} color="#fff" />
            )}
          </View>
        ) : onQuickSell ? (
          <TouchableOpacity
            style={styles.sellBadge}
            onPress={onQuickSell}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="cash-outline" size={13} color={colors.secondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      <Text style={styles.name} numberOfLines={1}>
        {card?.name}
      </Text>
    </TouchableOpacity>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
  slot: {
    padding: 6,
    alignItems: 'center',
  },
  imageFrame: {
    width: '100%',
    aspectRatio: 63 / 88,
    borderRadius: radius.sm,
    backgroundColor: colors.muted,
    overflow: 'hidden',
    position: 'relative',
    // Ancho de borde fijo siempre (solo cambia el color al seleccionar) — si el
    // ancho cambiara de 0 a 3 al marcar/desmarcar, el contenedor (overflow:hidden)
    // se redimensiona y en Android eso puede dejar el <Image> de adentro en blanco
    // sin recuperarse hasta que la pantalla se recargue.
    borderWidth: 3,
    borderColor: 'transparent',
  },
  imageFrameSelected: {
    borderColor: colors.primary,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  priceOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '26%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 3,
    overflow: 'hidden',
  },
  priceText: {
    color: '#fff',
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  setIconBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 18,
    height: 18,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  setIcon: {
    width: '100%',
    height: '100%',
  },
  tagDot: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 9,
    height: 9,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  sellBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  checkBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  checkBadgeChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkBadgeDone: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  checkIcon: {
    color: '#fff',
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  name: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.foreground,
    marginTop: 4,
    textAlign: 'center',
  },
  });
}
