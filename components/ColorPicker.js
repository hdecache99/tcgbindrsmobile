import { useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTheme } from '../lib/ThemeContext';
import { fonts, radius, spacing } from '../theme';

function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x) =>
    Math.round(255 * x)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  if (h < 0) h += 360;
  return { h, s: s * 100, l: l * 100 };
}

const HUE_STOPS = ['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ff0000'];

function GradientSlider({ colors, ratio, onChange }) {
  const [width, setWidth] = useState(0);
  // Se necesita también en una ref porque los callbacks del gesto pueden
  // dispararse con un valor de `width` capturado viejo si solo se usara el
  // state directamente dentro del gesto memorizado.
  const widthRef = useRef(0);

  function handleX(x) {
    const w = widthRef.current;
    if (!w) return;
    onChange(Math.max(0, Math.min(1, x / w)));
  }

  // PanResponder (API vieja de RN) puede perder el gesto contra el ScrollView
  // nativo de Android a mitad del arrastre sin importar las flags de captura
  // — react-native-gesture-handler (ya es dependencia del proyecto, usada para
  // los gestos de navegación) negocia esto correctamente porque reemplaza el
  // sistema de touch de RN en vez de competir con él en JS.
  const pan = Gesture.Pan()
    .onBegin((e) => handleX(e.x))
    .onUpdate((e) => handleX(e.x))
    .runOnJS(true);

  return (
    <GestureDetector gesture={pan}>
      <View
        style={styles.track}
        onLayout={(e) => {
          widthRef.current = e.nativeEvent.layout.width;
          setWidth(e.nativeEvent.layout.width);
        }}
      >
        <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.trackGradient} />
        <View style={[styles.thumb, { left: Math.max(0, Math.min(width - 22, ratio * width - 11)) }]} />
      </View>
    </GestureDetector>
  );
}

// Elige literalmente cualquier color (no solo los presets fijos) moviendo 3
// barras — Tono/Saturación/Luminosidad — en vez de una sola dependencia nueva
// de "color picker": PanResponder + LinearGradient ya son parte del proyecto,
// no hacía falta instalar nada. El hex mostrado es solo informativo — la
// fuente de verdad mientras se arrastra es h/s/l, no el string hex (evita
// redondeos que "saltan" el color al ir y volver de hex).
export default function ColorPicker({ value, onChange }) {
  const { colors } = useTheme();
  const styles2 = getStyles(colors);
  const [hsl, setHsl] = useState(() => (value ? hexToHsl(value) : { h: 260, s: 65, l: 45 }));

  function update(next) {
    setHsl(next);
    onChange(hslToHex(next.h, next.s, next.l));
  }

  const hueColor = hslToHex(hsl.h, 100, 50);
  const currentHex = hslToHex(hsl.h, hsl.s, hsl.l);

  return (
    <View>
      <View style={styles2.previewRow}>
        <View style={[styles2.previewSwatch, { backgroundColor: currentHex }]} />
        <Text style={styles2.previewHex}>{currentHex.toUpperCase()}</Text>
      </View>

      <GradientSlider colors={HUE_STOPS} ratio={hsl.h / 360} onChange={(r) => update({ ...hsl, h: r * 360 })} />
      <View style={styles2.sliderGap} />
      <GradientSlider
        colors={['#808080', hueColor]}
        ratio={hsl.s / 100}
        onChange={(r) => update({ ...hsl, s: r * 100 })}
      />
      <View style={styles2.sliderGap} />
      <GradientSlider
        colors={['#000000', hueColor, '#ffffff']}
        ratio={hsl.l / 100}
        onChange={(r) => update({ ...hsl, l: r * 100 })}
      />
    </View>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
    previewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    previewSwatch: {
      width: 32,
      height: 32,
      borderRadius: radius.pill,
      borderWidth: 1.5,
      borderColor: colors.border,
      marginRight: spacing.sm,
    },
    previewHex: {
      fontFamily: fonts.semibold,
      fontSize: 13,
      color: colors.foreground,
    },
    sliderGap: {
      height: spacing.md,
    },
  });
}

const styles = StyleSheet.create({
  track: {
    height: 28,
    justifyContent: 'center',
  },
  trackGradient: {
    height: 14,
    borderRadius: 7,
  },
  thumb: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#fff',
    top: 3,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
});
