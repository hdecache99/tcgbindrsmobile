import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts, radius } from '../theme';
import { useTheme } from '../lib/ThemeContext';

function getVariants(colors) {
  return {
    primary: { backgroundColor: colors.primary, textColor: '#fff', borderWidth: 0 },
    secondary: { backgroundColor: colors.card, textColor: colors.foreground, borderWidth: 1.5 },
  };
}

// `icon`: nombre de Ionicons (ej. "settings-outline") para mostrar a la
// izquierda del texto — reemplaza los emojis que se usaban antes como ícono.
// `iconComponent`: nodo ya renderizado (ej. un logo SVG a color de un
// proveedor OAuth) — tiene prioridad sobre `icon` cuando ambos se pasan.
export default function Button({
  title,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  textColor,
  style,
  compact,
  icon,
  iconComponent,
}) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const VARIANTS = getVariants(colors);
  const v = VARIANTS[variant];
  const resolvedTextColor = textColor || v.textColor;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        compact && styles.baseCompact,
        { backgroundColor: v.backgroundColor, borderWidth: v.borderWidth, borderColor: colors.border },
        variant === 'primary' && styles.shadowPrimary,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={resolvedTextColor} size={compact ? 'small' : undefined} />
      ) : (
        <View style={styles.content}>
          {iconComponent ? (
            <View style={styles.icon}>{iconComponent}</View>
          ) : icon ? (
            <Ionicons name={icon} size={compact ? 14 : 17} color={resolvedTextColor} style={styles.icon} />
          ) : null}
          <Text
            style={[styles.text, compact && styles.textCompact, { color: resolvedTextColor }]}
            numberOfLines={1}
            adjustsFontSizeToFit={compact}
            minimumFontScale={0.8}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseCompact: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  shadowPrimary: {
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 6,
  },
  text: {
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  textCompact: {
    fontSize: 12,
  },
  });
}
