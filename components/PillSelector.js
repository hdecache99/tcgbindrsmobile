import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fonts, radius } from '../theme';
import { useTheme } from '../lib/ThemeContext';

// `columns`: si se da, cada pill ocupa un ancho igual para que las filas queden
// parejas (grid real) en vez de envolver por contenido — útil con grupos largos
// (ej. los 6 juegos). Usa `justifyContent: space-between` + ancho fijo en vez de
// `gap`, porque mezclar `gap` con anchos en % puede desbordar la fila en RN.
// `getColor(value)`: opcional, para pintar un punto de color antes del texto
// (ej. el color determinístico de una etiqueta/marcador). Sin `getColor`, o si
// devuelve algo falsy para una opción, esa pill no muestra punto.
// Sin `columns`, el comportamiento es el de siempre.
export default function PillSelector({ options, value, onChange, columns, getColor }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={[styles.row, columns && styles.rowGrid]}>
      {options.map((opt) => {
        const active = value === opt.value;
        const dotColor = getColor?.(opt.value);
        return (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.pill,
              columns ? { width: `${100 / columns - 2}%`, marginBottom: 8 } : null,
              active && styles.pillActive,
            ]}
            onPress={() => onChange(opt.value)}
          >
            {dotColor ? <View style={[styles.dot, { backgroundColor: dotColor }]} /> : null}
            <Text style={[styles.pillText, active && styles.pillTextActive]} numberOfLines={1}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rowGrid: {
    justifyContent: 'space-between',
    gap: 0,
  },
  pill: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    marginRight: 6,
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    color: colors.foreground,
    fontFamily: fonts.medium,
  },
  pillTextActive: {
    color: '#fff',
    fontFamily: fonts.semibold,
  },
  });
}
