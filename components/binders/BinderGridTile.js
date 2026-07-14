import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { fonts, radius, spacing } from '../../theme';
import { useTheme } from '../../lib/ThemeContext';
import { VISIBILITY_LABEL, VISIBILITY_COLOR } from '../../constants/visibility';
import Badge from '../Badge';

// Ciclo automático entre las cartas del binder — no un carrusel deslizable:
// la tarjetita vive dentro de un FlatList con scroll propio, y un swipe manual
// acá adentro pelearía por el gesto contra ese scroll (mismo problema que el
// slider del ColorPicker dentro del ScrollView de BinderSettingsScreen). Un
// ciclo por tiempo da la sensación de "carrusel" sin necesitar ningún gesto.
// Solo cross-dissolve acá — el efecto de "filtro" va en el fondo (ShineSweep),
// no en la carta misma.
function CardCarousel({ previews }) {
  const [index, setIndex] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (previews.length <= 1) return undefined;
    const interval = setInterval(() => {
      Animated.timing(opacity, { toValue: 0, duration: 280, useNativeDriver: true }).start(() => {
        setIndex((i) => (i + 1) % previews.length);
        Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }).start();
      });
    }, 2200);
    return () => clearInterval(interval);
  }, [previews.length]);

  const img = previews[index]?.card?.image_url_small;
  if (!img) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
      <Image source={{ uri: img }} style={StyleSheet.absoluteFill} resizeMode="contain" />
    </Animated.View>
  );
}

// "Filtro" animado del FONDO del binder (no de la carta) — un brillo claro en
// diagonal que barre lentamente el fondo de color en loop, como un destello
// de foil/holo. Se pinta ANTES que el lomo y el área de la carta en el JSX,
// así que solo se ve por donde el fondo queda expuesto (el padding alrededor
// de la carta y el lomo), nunca sobre la carta en sí.
function ShineSweep() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(1400),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [-140, 220] });

  return (
    <Animated.View style={[staticStyles.shine, { transform: [{ translateX }, { rotate: '20deg' }] }]} pointerEvents="none">
      <LinearGradient
        colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

// No depende de `colors` del tema — se define una sola vez a nivel de módulo
// en vez de recrearse dentro de getStyles(colors) en cada render.
const staticStyles = StyleSheet.create({
  shine: {
    position: 'absolute',
    top: -20,
    bottom: -20,
    width: 50,
  },
});

// Tarjetita de binder usada en toda la app (mis binders, feed, perfiles
// propio/ajeno) — antes cada pantalla tenía su propia versión en fila; ahora
// es una sola grilla consistente. `binder.owner?.username` se muestra solo si
// viene en el objeto (ej. en el Feed, donde cada binder es de alguien
// distinto); en pantallas de un solo dueño no hace falta repetirlo. La forma
// de "carpeta" (lomo + anillos a la izquierda) es a propósito literal — la
// app entera es sobre binders, así que el ícono de la tarjetita debería
// parecer uno de verdad, no solo una foto suelta.
export default function BinderGridTile({ binder, onPress }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const previews = (binder.previews || []).filter((p) => p.card?.image_url_small);
  const coverBg = binder.theme_color || colors.muted;
  const visibilityStyle = VISIBILITY_COLOR[binder.visibility];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={[styles.coverWrapper, { backgroundColor: coverBg }]}>
        <ShineSweep />
        <View style={styles.spine} />

        <View style={styles.coverImageArea}>
          {previews.length > 0 ? (
            <CardCarousel previews={previews} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Ionicons name="albums-outline" size={30} color="rgba(255,255,255,0.6)" />
            </View>
          )}
        </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {binder.title}
        </Text>
        {binder.owner?.username ? (
          <Text style={styles.owner} numberOfLines={1}>
            @{binder.owner.username}
          </Text>
        ) : null}
        <View style={styles.metaRow}>
          <Badge
            label={VISIBILITY_LABEL[binder.visibility]}
            color={visibilityStyle.color}
            backgroundColor={visibilityStyle.backgroundColor}
          />
          <Text style={styles.count}>{binder.card_count} cartas</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const SPINE_WIDTH = 16;

function getStyles(colors) {
  return StyleSheet.create({
  card: {
    flex: 1,
    margin: 6,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  coverWrapper: {
    width: '100%',
    aspectRatio: 1.3,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  spine: {
    width: SPINE_WIDTH,
    backgroundColor: 'rgba(0,0,0,0.24)',
  },
  coverImageArea: {
    flex: 1,
    padding: 10,
  },
  coverPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    padding: spacing.sm,
  },
  title: {
    fontFamily: fonts.semibold,
    color: colors.foreground,
    fontSize: 13,
  },
  owner: {
    fontFamily: fonts.medium,
    color: colors.primary,
    fontSize: 11,
    marginTop: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  count: {
    fontFamily: fonts.regular,
    color: colors.mutedForeground,
    fontSize: 11,
  },
  });
}
