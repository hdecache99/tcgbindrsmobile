import { useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { signInWithOAuth } from '../lib/oauth';
import GoogleLogo from './icons/GoogleLogo';
import FacebookLogo from './icons/FacebookLogo';
import { spacing } from '../theme';
import { useTheme } from '../lib/ThemeContext';

// Microsoft ('azure') queda fuera por ahora: Supabase no logra obtener el
// email desde Azure incluso con los permisos de Graph (email/profile)
// agregados y consentidos — ver nota en memoria del proyecto. Google y
// Facebook funcionan bien.
//
// Solo el logo, sin texto ni fondo de marca — círculos de vidrio (mismo
// BlurView que la tarjeta del login) para que se vean como parte del mismo
// sistema visual en vez de botones de proveedor genéricos.
const PROVIDERS = [
  { key: 'google', icon: <GoogleLogo size={22} /> },
  { key: 'facebook', icon: <FacebookLogo size={22} color="#1877F2" /> },
];

const CIRCLE = 54;

export default function OAuthButtons() {
  const { isDark } = useTheme();
  const [loadingProvider, setLoadingProvider] = useState(null);

  // Mismo tinte de vidrio que la tarjeta del login — transparente y legible
  // tanto en claro como en oscuro, en vez de un blanco fijo.
  const glassBg = isDark ? 'rgba(20,14,26,0.35)' : 'rgba(255,255,255,0.35)';
  const glassBorder = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.6)';

  async function handlePress(provider) {
    setLoadingProvider(provider);
    try {
      await signInWithOAuth(provider);
      // Si el login fue exitoso, el listener de sesión en RootNavigator
      // navega solo — no hace falta hacer nada más aquí.
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[oauth]', err.message);
    } finally {
      setLoadingProvider(null);
    }
  }

  return (
    <View style={styles.row}>
      {PROVIDERS.map((p) => (
        <TouchableOpacity
          key={p.key}
          onPress={() => handlePress(p.key)}
          disabled={!!loadingProvider}
          activeOpacity={0.8}
          style={styles.circleWrap}
        >
          <BlurView
            intensity={50}
            tint={isDark ? 'dark' : 'light'}
            experimentalBlurMethod="dimezisBlurView"
            style={styles.circle}
          >
            <View style={[styles.circleGlass, { backgroundColor: glassBg, borderColor: glassBorder }]}>
              {loadingProvider === p.key ? <ActivityIndicator size="small" /> : p.icon}
            </View>
          </BlurView>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  circleWrap: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  circle: {
    flex: 1,
  },
  circleGlass: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
