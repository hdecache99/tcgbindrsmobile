import { useEffect, useRef } from 'react';
import { Animated, Easing, Modal, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ColorAura from './ColorAura';
import HexagonField from './HexagonField';
import ExplosionBurst from './ExplosionBurst';
import { fonts } from '../../theme';

// Recreación (simplificada, con Animated nativo — sin libs extra) de
// BinderIntro.tsx de la web: overlay de pantalla completa que se muestra una
// sola vez al abrir el binder público (nunca al dueño editando, igual que la
// web). El tipo/duración por defecto igualan los de web/BinderIntro.tsx.
//
// Cada elemento tiene su PROPIO Animated.Value con su propio delay/easing en
// vez de un único `enter` compartido por todo — animar todo en el mismo
// instante y con la misma curva es justo lo que hace que una animación se
// sienta "hecha" en vez de fluida; el escalonado (stagger) es lo que lo
// arregla.
const DURATIONS = {
  pokemon: 2900,
  fade: 2600,
  cyber: 3000,
  spotlight: 2500,
  hexagon: 2800,
};

const EASE_OUT = Easing.out(Easing.cubic);
const BOOK_COVER_WIDTH = 110;
const BOOK_COVER_HEIGHT = 150;

function staggerIn(values, staggerMs = 110, duration = 420) {
  Animated.stagger(
    staggerMs,
    values.map((v) => Animated.timing(v, { toValue: 1, duration, easing: EASE_OUT, useNativeDriver: true }))
  ).start();
}

export default function BinderIntro({ type = 'fade', title, username, themeColor, cardCount, onComplete }) {
  const accent = themeColor || '#7A3B9A';
  const duration = DURATIONS[type] || DURATIONS.fade;

  const enter = useRef(new Animated.Value(0)).current;
  const exit = useRef(new Animated.Value(0)).current;
  const scan = useRef(new Animated.Value(0)).current;
  const dismissed = useRef(false);

  // Elementos individuales para el stagger — cada intro usa los que necesita.
  const el1 = useRef(new Animated.Value(0)).current;
  const el2 = useRef(new Animated.Value(0)).current;
  const el3 = useRef(new Animated.Value(0)).current;
  const el4 = useRef(new Animated.Value(0)).current;
  // Separado de el3: `width` (barra de progreso de PokemonIntro) no lo soporta
  // el driver nativo — mezclarlo en el mismo Animated.Value que además anima
  // `opacity` con useNativeDriver:true revienta con "Style property 'width'
  // is not supported by native animated module". Esta barra corre en JS.
  const barProgress = useRef(new Animated.Value(0)).current;

  function dismiss() {
    if (dismissed.current) return;
    dismissed.current = true;
    Animated.timing(exit, { toValue: 1, duration: 450, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(
      onComplete
    );
  }

  useEffect(() => {
    Animated.spring(enter, { toValue: 1, friction: 8, tension: 55, useNativeDriver: true }).start();
    staggerIn([el1, el2, el3, el4]);

    if (type === 'pokemon') {
      Animated.timing(barProgress, {
        toValue: 1,
        duration: 420,
        delay: 220,
        easing: EASE_OUT,
        useNativeDriver: false,
      }).start();
    }

    if (type === 'cyber') {
      Animated.loop(
        Animated.timing(scan, { toValue: 1, duration: 1600, easing: Easing.linear, useNativeDriver: true })
      ).start();
    }

    const timer = setTimeout(dismiss, duration);
    return () => clearTimeout(timer);
  }, []);

  const overlayOpacity = exit.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={dismiss}>
      <TouchableWithoutFeedback onPress={dismiss}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          {type === 'pokemon' ? (
            <PokemonIntro
              enter={enter}
              exit={exit}
              el1={el1}
              el2={el2}
              el3={el3}
              barProgress={barProgress}
              accent={accent}
              title={title}
              username={username}
              cardCount={cardCount}
            />
          ) : type === 'cyber' ? (
            <CyberIntro
              enter={enter}
              scan={scan}
              el1={el1}
              el2={el2}
              el3={el3}
              accent={accent}
              title={title}
              username={username}
              cardCount={cardCount}
            />
          ) : type === 'spotlight' ? (
            <SpotlightIntro el2={el2} el3={el3} el4={el4} accent={accent} title={title} username={username} />
          ) : type === 'hexagon' ? (
            <HexagonIntro el1={el1} el2={el2} el3={el3} accent={accent} title={title} username={username} />
          ) : (
            <FadeIntro el1={el1} el2={el2} el3={el3} accent={accent} title={title} username={username} />
          )}
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

function PokemonIntro({ enter, exit, el1, el2, el3, barProgress, accent, title, username, cardCount }) {
  const topEnter = enter.interpolate({ inputRange: [0, 1], outputRange: [-400, 0] });
  const topExit = exit.interpolate({ inputRange: [0, 1], outputRange: [0, -400] });
  const bottomEnter = enter.interpolate({ inputRange: [0, 1], outputRange: [400, 0] });
  const bottomExit = exit.interpolate({ inputRange: [0, 1], outputRange: [0, 400] });
  const titleX = el1.interpolate({ inputRange: [0, 1], outputRange: [-60, 0] });
  const vsScale = el2.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const vsRotate = el2.interpolate({ inputRange: [0, 1], outputRange: ['-30deg', '0deg'] });
  const barWidth = barProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[styles.pokePanel, { top: 0, height: '50%', borderColor: accent, transform: [{ translateY: Animated.add(topEnter, topExit) }] }]}
      >
        <ColorAura color={accent} />
        <Ionicons name="albums" size={180} color={accent} style={[styles.pokeWatermark, styles.pokeWatermarkTop]} />
        <Animated.View style={[styles.pokeTitleRow, { opacity: el1, transform: [{ translateX: titleX }] }]}>
          <View style={[styles.pokeIconCircle, { backgroundColor: accent }]}>
            <Ionicons name="albums" size={28} color="#fff" />
          </View>
          <Text style={styles.pokeTitle} numberOfLines={2}>
            {title}
          </Text>
        </Animated.View>
      </Animated.View>

      <Animated.View
        style={[
          styles.pokePanel,
          { bottom: 0, height: '50%', borderColor: accent, transform: [{ translateY: Animated.add(bottomEnter, bottomExit) }] },
        ]}
      >
        <ColorAura color={accent} />
        <Ionicons name="albums" size={180} color={accent} style={[styles.pokeWatermark, styles.pokeWatermarkBottom]} />
        <Animated.View style={{ opacity: el3, alignItems: 'flex-end', width: '100%' }}>
          <Text style={styles.pokeTrainer}>ENTRENADOR @{username}</Text>
          <View style={styles.pokeBarTrack}>
            <Animated.View style={[styles.pokeBarFill, { width: barWidth, backgroundColor: accent }]} />
          </View>
          <Text style={styles.pokeDeck}>{cardCount ?? '—'} CARTAS EN EL MAZO</Text>
        </Animated.View>
      </Animated.View>

      <ExplosionBurst color={accent} />

      <Animated.View style={[styles.vsBadge, { transform: [{ scale: vsScale }, { rotate: vsRotate }] }]}>
        <Text style={styles.vsText}>VS</Text>
      </Animated.View>
    </View>
  );
}

function CyberIntro({ enter, scan, el1, el2, el3, accent, title, username, cardCount }) {
  const scanX = scan.interpolate({ inputRange: [0, 1], outputRange: [-150, 400] });
  const panelScale = enter.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] });
  const titleX = el2.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] });
  const footerY = el3.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });

  return (
    <View style={styles.cyberBg}>
      <LinearGradient colors={['#000', '#0a0a1a', '#000']} style={StyleSheet.absoluteFill} />
      <ColorAura color={accent} />
      <Animated.View style={[styles.cyberPanel, { borderLeftColor: accent, opacity: enter, transform: [{ scale: panelScale }] }]}>
        <View style={styles.cyberScanClip}>
          <Animated.View style={[styles.cyberScanBar, { backgroundColor: accent, transform: [{ translateX: scanX }] }]} />
        </View>
        <Animated.View style={[styles.cyberTitleStack, { opacity: el2, transform: [{ translateX: titleX }] }]}>
          <Text style={[styles.cyberTitleShadow, { color: accent }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.cyberTitle} numberOfLines={1}>
            {title}
          </Text>
        </Animated.View>
        <Animated.Text style={[styles.cyberFooter, { opacity: el3, transform: [{ translateY: footerY }] }]}>
          @{(username || '').toUpperCase()} · {cardCount ?? '—'} ITEMS CARGADOS
        </Animated.Text>
      </Animated.View>
    </View>
  );
}

// "Spotlight" ahora es una explosión (flash + esquirlas volando desde el
// centro vía ExplosionBurst) en vez de un cono de luz — el badge/título/pill
// quedan pero con un timing más "de impacto" (título entra grande y se
// asienta, en vez de un fade suave).
function SpotlightIntro({ el2, el3, el4, accent, title, username }) {
  const badgeScale = el2.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const titleScale = el3.interpolate({ inputRange: [0, 1], outputRange: [1.4, 1] });
  const pillY = el4.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  return (
    <View style={styles.spotlightBg}>
      <ExplosionBurst color={accent} />

      <Animated.View style={[styles.spotlightBadge, { backgroundColor: accent, transform: [{ scale: badgeScale }], opacity: el2 }]}>
        <Ionicons name="flash" size={20} color="#fff" />
      </Animated.View>

      <Animated.View style={{ opacity: el3, transform: [{ scale: titleScale }] }}>
        <Text style={styles.spotlightTitle} numberOfLines={2}>
          {title}
        </Text>
      </Animated.View>

      <Animated.View style={[styles.spotlightPill, { opacity: el4, borderColor: accent, transform: [{ translateY: pillY }] }]}>
        <Text style={[styles.spotlightPillText, { color: accent }]}>Curado por @{username}</Text>
      </Animated.View>
    </View>
  );
}

// "Fade" ahora es un libro abriéndose: dos tapas que giran en rotateY desde
// el lomo central (como una puerta doble) revelando el título detrás. RN no
// tiene transform-origin nativo (a diferencia de la web, que sí), así que
// cada tapa usa el truco estándar de trasladar-rotar-trasladar para que el
// pivote de giro quede en el borde del lomo en vez del centro de la vista.
function FadeIntro({ el1, el2, el3, accent, title, username }) {
  const coverAngle = el1.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const leftRotate = coverAngle.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-108deg'] });
  const rightRotate = coverAngle.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '108deg'] });
  const titleScale = el2.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] });
  const subtitleY = el3.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });
  const HALF = BOOK_COVER_WIDTH / 2;

  return (
    <View style={styles.fadeBg}>
      <LinearGradient colors={[`${accent}33`, '#000']} style={StyleSheet.absoluteFill} />
      <ColorAura color={accent} />

      <Animated.View style={{ alignItems: 'center', opacity: el2, transform: [{ scale: titleScale }] }}>
        <Animated.Text style={styles.fadeTitle} numberOfLines={2}>
          {title}
        </Animated.Text>
        <Animated.Text style={[styles.fadeSubtitle, { opacity: el3, transform: [{ translateY: subtitleY }] }]}>
          Colección de @{username}
        </Animated.Text>
      </Animated.View>

      <View style={styles.bookContainer} pointerEvents="none">
        <Animated.View
          style={[
            styles.bookCover,
            styles.bookCoverLeft,
            {
              backgroundColor: accent,
              transform: [{ translateX: HALF }, { perspective: 900 }, { rotateY: leftRotate }, { translateX: -HALF }],
            },
          ]}
        >
          <Ionicons name="book" size={22} color="rgba(255,255,255,0.5)" />
        </Animated.View>
        <Animated.View
          style={[
            styles.bookCover,
            styles.bookCoverRight,
            {
              backgroundColor: accent,
              transform: [{ translateX: -HALF }, { perspective: 900 }, { rotateY: rightRotate }, { translateX: HALF }],
            },
          ]}
        />
      </View>
    </View>
  );
}

function HexagonIntro({ el1, el2, el3, accent, title, username }) {
  const iconScale = el2.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const titleY = el2.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
  const subtitleY = el3.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });

  return (
    <View style={styles.hexagonBg}>
      <HexagonField color={accent} />
      <Animated.View style={{ alignItems: 'center', opacity: el1 }}>
        <Animated.View style={[styles.hexagonIconBox, { backgroundColor: accent, transform: [{ scale: iconScale }] }]}>
          <Ionicons name="git-network-outline" size={26} color="#fff" />
        </Animated.View>
        <Animated.Text style={[styles.hexagonTitle, { opacity: el2, transform: [{ translateY: titleY }] }]} numberOfLines={2}>
          {title}
        </Animated.Text>
        <Animated.Text style={[styles.hexagonSubtitle, { opacity: el3, transform: [{ translateY: subtitleY }] }]}>
          Colección de @{username}
        </Animated.Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    elevation: 100,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // pokemon
  pokePanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#111',
    borderWidth: 4,
    justifyContent: 'center',
    padding: 20,
    overflow: 'hidden',
  },
  pokeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pokeWatermark: {
    position: 'absolute',
    opacity: 0.08,
  },
  pokeWatermarkTop: {
    bottom: -50,
    right: -30,
  },
  pokeWatermarkBottom: {
    top: -50,
    left: -30,
  },
  pokeIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  pokeTitle: {
    color: '#fff',
    fontFamily: fonts.extrabold,
    fontSize: 28,
    flexShrink: 1,
  },
  pokeTrainer: {
    color: '#fff',
    fontFamily: fonts.bold,
    fontSize: 14,
    marginBottom: 10,
  },
  pokeBarTrack: {
    width: '100%',
    maxWidth: 220,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  pokeBarFill: {
    height: '100%',
  },
  pokeDeck: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 6,
  },
  vsBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -30,
    marginLeft: -30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  vsText: {
    color: '#111',
    fontFamily: fonts.extrabold,
    fontSize: 16,
  },

  // cyber
  cyberBg: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cyberPanel: {
    width: '84%',
    backgroundColor: 'rgba(20,20,30,0.7)',
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 24,
    overflow: 'hidden',
  },
  cyberScanClip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    overflow: 'hidden',
  },
  cyberScanBar: {
    width: 120,
    height: 2,
    opacity: 0.8,
  },
  cyberTitleStack: {
    marginTop: 8,
  },
  cyberTitleShadow: {
    position: 'absolute',
    left: 4,
    fontFamily: fonts.extrabold,
    fontSize: 26,
    textTransform: 'uppercase',
  },
  cyberTitle: {
    color: '#fff',
    fontFamily: fonts.extrabold,
    fontSize: 26,
    textTransform: 'uppercase',
  },
  cyberFooter: {
    color: 'rgba(255,255,255,0.6)',
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 14,
    letterSpacing: 1,
  },

  // spotlight
  spotlightBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  spotlightBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  spotlightTitle: {
    color: '#fff',
    fontFamily: fonts.extrabold,
    fontSize: 24,
    textAlign: 'center',
    paddingHorizontal: 32,
    marginBottom: 20,
  },
  spotlightPill: {
    borderWidth: 1.5,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  spotlightPillText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
  },

  // fade
  fadeBg: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bookContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -BOOK_COVER_WIDTH,
    marginTop: -BOOK_COVER_HEIGHT / 2,
    flexDirection: 'row',
    width: BOOK_COVER_WIDTH * 2,
    height: BOOK_COVER_HEIGHT,
  },
  bookCover: {
    width: BOOK_COVER_WIDTH,
    height: BOOK_COVER_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
  },
  bookCoverLeft: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  bookCoverRight: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  fadeTitle: {
    color: '#fff',
    fontFamily: fonts.extrabold,
    fontSize: 22,
    textAlign: 'center',
    letterSpacing: 2,
    textTransform: 'uppercase',
    paddingHorizontal: 32,
  },
  fadeSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontFamily: fonts.medium,
    fontSize: 13,
    marginTop: 10,
  },

  // hexagon
  hexagonBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  hexagonIconBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  hexagonTitle: {
    color: '#fff',
    fontFamily: fonts.extrabold,
    fontSize: 24,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  hexagonSubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontFamily: fonts.medium,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 10,
  },
});
