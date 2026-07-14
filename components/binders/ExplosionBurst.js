import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

const PARTICLE_COUNT = 16;
const FLASH_SIZE = 60;
const PARTICLE_SIZE = 8;

function Particle({ angle, distance, rotation, delay, color }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 800,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(angle) * distance] });
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(angle) * distance] });
  const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${rotation}deg`] });
  const opacity = anim.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] });
  const scale = anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.5, 1, 0.3] });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          backgroundColor: color,
          opacity,
          transform: [{ translateX }, { translateY }, { rotate }, { scale }],
        },
      ]}
    />
  );
}

// Flash + esquirlas volando desde el centro — usado por el intro "spotlight"
// (ahora una explosión, no un cono de luz). Cada partícula corre su propio
// Animated.Value nativo, igual que HexagonField — barato de animar en
// paralelo porque useNativeDriver:true las corre fuera del hilo de JS.
export default function ExplosionBurst({ color }) {
  const flash = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(flash, {
      toValue: 1,
      duration: 550,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, []);

  const flashScaleOuter = flash.interpolate({ inputRange: [0, 1], outputRange: [0, 8] });
  const flashScaleInner = flash.interpolate({ inputRange: [0, 1], outputRange: [0, 5.5] });
  const flashOpacity = flash.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.9, 0.5, 0] });

  const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    angle: (i / PARTICLE_COUNT) * Math.PI * 2,
    distance: 130 + ((i * 37) % 60),
    rotation: (i * 53) % 360,
    delay: (i % 4) * 20,
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View
        style={[styles.flash, { backgroundColor: '#fff', opacity: flashOpacity, transform: [{ scale: flashScaleOuter }] }]}
      />
      <Animated.View
        style={[styles.flash, { backgroundColor: color, opacity: flashOpacity, transform: [{ scale: flashScaleInner }] }]}
      />
      {particles.map((p, i) => (
        <Particle key={i} angle={p.angle} distance={p.distance} rotation={p.rotation} delay={p.delay} color={color} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flash: {
    position: 'absolute',
    width: FLASH_SIZE,
    height: FLASH_SIZE,
    borderRadius: FLASH_SIZE / 2,
  },
  particle: {
    position: 'absolute',
    width: PARTICLE_SIZE,
    height: PARTICLE_SIZE * 2,
    borderRadius: 2,
  },
});
