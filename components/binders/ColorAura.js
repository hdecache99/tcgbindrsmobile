import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

// "Aura" de color ambiental sin blur real — RN no tiene un filtro de blur
// barato/nativo para usar en varios lugares (por eso se sacó expo-blur antes,
// ver memoria del proyecto). En vez de eso, cada blob es un círculo grande y
// tenue con un núcleo más chico y algo más opaco adentro — simula el
// desvanecido de un glow sin necesitar blur real — y respira lento en loop
// (escala + opacidad) para que no se sienta estático/plano.
export default function ColorAura({ color = '#7A3B9A' }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 3400, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 3400, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });
  const outerOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.22] });

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View
        style={[styles.blobOuter, styles.topLeft, { backgroundColor: color, opacity: outerOpacity, transform: [{ scale }] }]}
      >
        <View style={[styles.blobInner, { backgroundColor: color }]} />
      </Animated.View>

      <Animated.View
        style={[styles.blobOuter, styles.bottomRight, { backgroundColor: color, opacity: outerOpacity, transform: [{ scale }] }]}
      >
        <View style={[styles.blobInner, { backgroundColor: color }]} />
      </Animated.View>
    </View>
  );
}

const BLOB_SIZE = 260;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  blobOuter: {
    position: 'absolute',
    width: BLOB_SIZE,
    height: BLOB_SIZE,
    borderRadius: BLOB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blobInner: {
    width: BLOB_SIZE * 0.45,
    height: BLOB_SIZE * 0.45,
    borderRadius: (BLOB_SIZE * 0.45) / 2,
    opacity: 0.45,
  },
  topLeft: {
    top: -BLOB_SIZE * 0.45,
    left: -BLOB_SIZE * 0.45,
  },
  bottomRight: {
    bottom: -BLOB_SIZE * 0.45,
    right: -BLOB_SIZE * 0.45,
  },
});
