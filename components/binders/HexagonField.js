import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const HEX_SIZE = 64;
const HEX_HEIGHT = HEX_SIZE * 0.87;
const HEX_COLS = Math.ceil(SCREEN_W / (HEX_SIZE * 0.75)) + 1;
const HEX_ROWS = Math.ceil(SCREEN_H / HEX_HEIGHT) + 1;

// Mismos puntos que el polygon() de la web (BinderIntro.tsx) — hexágono
// "flat-top" para que las filas se entrelacen en panal al desplazarlas media
// celda cada fila impar.
const HEX_POINTS = `${HEX_SIZE / 2},0 ${HEX_SIZE},${HEX_HEIGHT * 0.25} ${HEX_SIZE},${HEX_HEIGHT * 0.75} ${HEX_SIZE / 2},${HEX_HEIGHT} 0,${HEX_HEIGHT * 0.75} 0,${HEX_HEIGHT * 0.25}`;

function Hex({ left, bottom, delay, opacity, color }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 900,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [80, 0] });
  const scale = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 1.15, 1] });
  const animOpacity = anim.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: [0, opacity, opacity * 0.35, opacity],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left,
        bottom,
        opacity: animOpacity,
        transform: [{ translateY }, { scale }],
      }}
    >
      <Svg width={HEX_SIZE} height={HEX_HEIGHT}>
        <Polygon points={HEX_POINTS} fill={color} />
      </Svg>
    </Animated.View>
  );
}

// Campo de hexágonos tipo panal que suben desde abajo, parpadean (blip de
// opacidad) y hacen zoom al asentarse — usado como fondo de BinderIntro's
// tipo "hexagon". Réplica de la versión web (mismo cálculo de fila/columna,
// mismo delay "de abajo hacia arriba": las filas de más abajo entran primero).
export default function HexagonField({ color }) {
  const hexes = [];
  for (let r = 0; r < HEX_ROWS; r++) {
    for (let c = 0; c < HEX_COLS; c++) {
      hexes.push({
        r,
        c,
        opacity: 0.12 + ((r * 7 + c * 13) % 5) / 25,
      });
    }
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {hexes.map(({ r, c, opacity }) => (
        <Hex
          key={`${r}-${c}`}
          left={c * HEX_SIZE * 0.75 + (r % 2 ? HEX_SIZE * 0.375 : 0)}
          bottom={r * HEX_HEIGHT}
          delay={(HEX_ROWS - r) * 70 + c * 25}
          opacity={opacity}
          color={color}
        />
      ))}
    </View>
  );
}
