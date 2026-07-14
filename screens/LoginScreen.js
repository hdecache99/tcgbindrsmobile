import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { supabase } from '../lib/supabase';
import Button from '../components/Button';
import TextField from '../components/TextField';
import ErrorText from '../components/ErrorText';
import TextLink from '../components/TextLink';
import OAuthButtons from '../components/OAuthButtons';
import ColorAura from '../components/binders/ColorAura';
import { fonts, radius, spacing } from '../theme';
import { useTheme } from '../lib/ThemeContext';

// Entrada escalonada (logo -> tagline -> tarjeta -> oauth), cada elemento con
// su propio Animated.Value en vez de compartir uno solo — mismo patrón que
// BinderIntro.js, evita el bug de mezclar una opacity nativa con algo que
// necesite useNativeDriver:false en el mismo valor.
function useStagger(count, delayStep = 110) {
  const values = useRef(Array.from({ length: count }, () => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(
      delayStep,
      values.map((v) =>
        Animated.spring(v, { toValue: 1, useNativeDriver: true, damping: 14, mass: 0.9, stiffness: 120 })
      )
    ).start();
  }, []);

  return values.map((v) => ({
    opacity: v,
    transform: [
      {
        translateY: v.interpolate({ inputRange: [0, 1], outputRange: [22, 0] }),
      },
    ],
  }));
}

export default function LoginScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const [logoStyle, taglineStyle, cardStyle, oauthStyle] = useStagger(4);

  // Aura ambiental respirando en loop, independiente del stagger de entrada.
  // Más viva/saturada que en otras pantallas a propósito — el vidrio
  // esmerilado de la tarjeta solo se lee como "vidrio" si hay color de
  // verdad detrás para refractar.
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  const logoScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] });

  async function handleLogin() {
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? 'Correo o contraseña incorrectos.'
          : error.message
      );
    }
    // Si no hay error, el listener de sesión en RootNavigator se encarga de navegar.
  }

  return (
    <View style={styles.root}>
      <ColorAura color={colors.primary} />
      <ColorAura color="#f59e0b" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Animated.View style={[styles.logoWrap, logoStyle]}>
            <Animated.Image
              source={require('../assets/brand/logo-icon.png')}
              style={[styles.logoMark, { transform: [{ scale: logoScale }] }]}
              resizeMode="contain"
            />
            <Text style={styles.wordmark}>TCGBINDRS</Text>
          </Animated.View>

          <Animated.Text style={[styles.subtitulo, taglineStyle]}>
            Organiza, valora y comparte tu colección
          </Animated.Text>

          <Animated.View style={[styles.cardShadowWrap, cardStyle]}>
            <BlurView
              intensity={40}
              tint={isDark ? 'dark' : 'light'}
              experimentalBlurMethod="dimezisBlurView"
              style={styles.card}
            >
              <View style={styles.cardGlassOverlay} pointerEvents="none" />

              <ErrorText>{error}</ErrorText>

              <TextField
                placeholder="tu@email.com"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              <TextField placeholder="Contraseña" secureTextEntry value={password} onChangeText={setPassword} />

              <Button title="Iniciar Sesión" onPress={handleLogin} loading={loading} style={styles.boton} />

              <TextLink title="¿Olvidaste tu contraseña?" onPress={() => navigation.navigate('ForgotPassword')} />
              <TextLink title="¿No tienes cuenta? Regístrate" onPress={() => navigation.navigate('Signup')} />
            </BlurView>
          </Animated.View>

          <Animated.View style={[styles.oauthSection, oauthStyle]}>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>o continúa con</Text>
              <View style={styles.dividerLine} />
            </View>
            <OAuthButtons />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function getStyles(colors, isDark) {
  // Vidrio esmerilado con distinto tinte según el tema — en claro se ve como
  // vidrio blanco/luminoso, en oscuro como vidrio ahumado, ambos dejando
  // pasar el color del aura de fondo en vez de taparlo.
  const glassBg = isDark ? 'rgba(20,14,26,0.35)' : 'rgba(255,255,255,0.22)';
  const glassBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.5)';
  const glassHighlight = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.7)';

  return StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  logoMark: {
    width: 96,
    height: 132,
  },
  wordmark: {
    fontSize: 26,
    fontFamily: fonts.extrabold,
    color: colors.foreground,
    letterSpacing: 1,
    marginTop: spacing.sm,
  },
  subtitulo: {
    fontFamily: fonts.regular,
    color: colors.mutedForeground,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  cardShadowWrap: {
    width: '100%',
    borderRadius: radius.xl,
    shadowColor: colors.primary,
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  card: {
    width: '100%',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: glassBorder,
    padding: spacing.lg,
    overflow: 'hidden',
    backgroundColor: glassBg,
  },
  cardGlassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    borderTopColor: glassHighlight,
  },
  boton: {
    width: '100%',
    marginTop: spacing.sm,
  },
  oauthSection: {
    width: '100%',
    marginTop: spacing.xl,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: spacing.sm,
    color: colors.mutedForeground,
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  });
}
