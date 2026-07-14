import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../lib/ThemeContext';
import AuthStack from './AuthStack';
import AppTabs from './AppTabs';
import SetUsernameScreen from '../screens/SetUsernameScreen';

export default function RootNavigator() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsUsername, setNeedsUsername] = useState(false);

  // "tmp_..." = cuenta creada por OAuth (Google/Facebook) sin username elegido
  // por el usuario todavía (ver handle_new_user() en Supabase). Se revisa en
  // cada cambio de sesión, no solo al abrir la app, para agarrar el caso justo
  // después de un login con Google/Facebook.
  async function checkNeedsUsername(activeSession) {
    if (!activeSession) {
      setNeedsUsername(false);
      return;
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', activeSession.user.id)
      .maybeSingle();
    setNeedsUsername(!!profile?.username?.startsWith('tmp_'));
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      await checkNeedsUsername(session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      checkNeedsUsername(session);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (session && needsUsername) {
    return <SetUsernameScreen onDone={() => setNeedsUsername(false)} />;
  }

  return session ? <AppTabs /> : <AuthStack />;
}

function getStyles(colors) {
  return StyleSheet.create({
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
  });
}
