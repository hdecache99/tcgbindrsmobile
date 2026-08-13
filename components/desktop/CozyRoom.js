import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { fonts, radius, spacing } from '../../theme';

const ROOM_HEIGHT = 300;
const WALL_HEIGHT = 190;
const FLOOR_HEIGHT = ROOM_HEIGHT - WALL_HEIGHT;

const PALETTE = {
  light: {
    wallTop: '#fbeee0',
    wallBottom: '#f3ddc4',
    floor: '#d9b98a',
    floorEdge: '#c7a374',
    windowGlow: ['#fff6d8', '#ffdf9e'],
    ray: 'rgba(255, 244, 214, 0.4)',
  },
  dark: {
    wallTop: '#241b2e',
    wallBottom: '#1a1322',
    floor: '#4a3420',
    floorEdge: '#3a2818',
    windowGlow: ['#4a3a70', '#241a38'],
    ray: 'rgba(157, 94, 194, 0.18)',
  },
};

// Trapecio del piso: más angosto atrás (arriba) que adelante (abajo), para
// simular perspectiva sin usar transforms 3D reales — 2D con truco visual.
function floorPoints(width) {
  const backLeft = width * 0.28;
  const backRight = width * 0.72;
  return `${backLeft},0 ${backRight},0 ${width},${FLOOR_HEIGHT} 0,${FLOOR_HEIGHT}`;
}

// Posición de un objeto sobre el trapecio: t=0 atrás (chico), t=1 adelante
// (grande); f=0..1 de izquierda a derecha dentro del ancho disponible en esa
// profundidad.
function hotspotLayout(width, t, f) {
  const backLeft = width * 0.28;
  const backRight = width * 0.72;
  const leftEdge = backLeft + (0 - backLeft) * t;
  const rightEdge = backRight + (width - backRight) * t;
  const x = leftEdge + f * (rightEdge - leftEdge);
  const y = FLOOR_HEIGHT * t;
  const scale = 0.75 + t * 0.35;
  return { x, y, scale };
}

function Plant({ side, colors }) {
  return (
    <View style={[styles.plant, side === 'left' ? { left: 8 } : { right: 8 }]} pointerEvents="none">
      <View style={[styles.leaf, { backgroundColor: '#4a8f5c', width: 26, height: 26, bottom: 16 }]} />
      <View style={[styles.leaf, { backgroundColor: '#5fae70', width: 22, height: 22, bottom: 20, left: side === 'left' ? -8 : undefined, right: side === 'right' ? -8 : undefined }]} />
      <View style={[styles.leaf, { backgroundColor: '#3d7a4c', width: 18, height: 18, bottom: 24, left: side === 'left' ? 10 : undefined, right: side === 'right' ? 10 : undefined }]} />
      <View style={[styles.pot, { backgroundColor: colors.floorEdge }]} />
    </View>
  );
}

function Hotspot({ layout, icon, label, color, onPress }) {
  return (
    <TouchableOpacity
      style={[
        styles.hotspot,
        {
          left: layout.x - 26 * layout.scale,
          top: WALL_HEIGHT + layout.y - 40 * layout.scale,
          transform: [{ scale: layout.scale }],
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.hotspotShadow, { backgroundColor: color }]}>
        <View style={styles.hotspotIcon}>{icon}</View>
      </View>
      <Text style={styles.hotspotLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function CozyRoom({ colors, isDark, onSelectBinder, onSelectPublic, onSelectMenu }) {
  const { width: screenWidth } = useWindowDimensions();
  const width = screenWidth - spacing.lg * 2;
  const palette = isDark ? PALETTE.dark : PALETTE.light;

  const binderLayout = hotspotLayout(width, 0.45, 0.2);
  const rackLayout = hotspotLayout(width, 0.55, 0.8);
  const menuLayout = hotspotLayout(width, 0.9, 0.5);

  return (
    <View style={[styles.room, { width, height: ROOM_HEIGHT }]}>
      <LinearGradient
        colors={[palette.wallTop, palette.wallBottom]}
        style={[styles.wall, { height: WALL_HEIGHT }]}
      />

      <View style={styles.window}>
        <LinearGradient colors={palette.windowGlow} style={StyleSheet.absoluteFill} />
        <View style={styles.windowMullionV} />
        <View style={styles.windowMullionH} />
      </View>

      <LinearGradient
        colors={[palette.ray, 'transparent']}
        style={styles.rayLeft}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <LinearGradient
        colors={[palette.ray, 'transparent']}
        style={styles.rayRight}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      <View style={[styles.floorWrap, { top: WALL_HEIGHT, height: FLOOR_HEIGHT }]}>
        <Svg width={width} height={FLOOR_HEIGHT}>
          <Polygon points={floorPoints(width)} fill={palette.floor} />
        </Svg>
        <Plant side="left" colors={palette} />
        <Plant side="right" colors={palette} />
      </View>

      <Hotspot
        layout={binderLayout}
        color={colors.primary}
        label="Mi binder"
        onPress={onSelectBinder}
        icon={<View style={styles.binderSpine} />}
      />
      <Hotspot
        layout={rackLayout}
        color={colors.secondary}
        label="Públicos"
        onPress={onSelectPublic}
        icon={
          <>
            <View style={[styles.rackBar, { backgroundColor: '#fff' }]} />
            <View style={[styles.rackBar, { backgroundColor: colors.accent }]} />
          </>
        }
      />
      <Hotspot
        layout={menuLayout}
        color={colors.accent}
        label="Menú"
        onPress={onSelectMenu}
        icon={<View style={styles.deskScreen} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  room: {
    alignSelf: 'center',
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  wall: {
    width: '100%',
  },
  window: {
    position: 'absolute',
    top: 34,
    left: '50%',
    marginLeft: -55,
    width: 110,
    height: 90,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.7)',
    overflow: 'hidden',
  },
  windowMullionV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  windowMullionH: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  rayLeft: {
    position: 'absolute',
    top: 60,
    left: '38%',
    width: 90,
    height: 160,
    transform: [{ rotate: '18deg' }],
  },
  rayRight: {
    position: 'absolute',
    top: 60,
    right: '38%',
    width: 90,
    height: 160,
    transform: [{ rotate: '-18deg' }],
  },
  floorWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  plant: {
    position: 'absolute',
    bottom: 4,
    width: 40,
    height: 60,
    alignItems: 'center',
  },
  leaf: {
    position: 'absolute',
    borderRadius: 999,
  },
  pot: {
    position: 'absolute',
    bottom: 0,
    width: 24,
    height: 18,
    borderRadius: 4,
  },
  hotspot: {
    position: 'absolute',
    alignItems: 'center',
    width: 80,
  },
  hotspotShadow: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  hotspotIcon: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotspotLabel: {
    marginTop: 4,
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 3,
    textShadowOffset: { width: 0, height: 1 },
  },
  binderSpine: {
    width: 16,
    height: 22,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  rackBar: {
    width: 18,
    height: 5,
    borderRadius: 2,
    marginVertical: 2,
  },
  deskScreen: {
    width: 20,
    height: 14,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
});
