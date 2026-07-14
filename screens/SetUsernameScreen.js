import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';
import Button from '../components/Button';
import TextField from '../components/TextField';
import ErrorText from '../components/ErrorText';
import { fonts, spacing } from '../theme';
import { useTheme } from '../lib/ThemeContext';

// Se muestra una sola vez, justo después de un primer login por Google/Facebook
// (RootNavigator la renderiza directo cuando detecta `profiles.username` con
// prefijo "tmp_" — ver handle_new_user() en Supabase). Sin `navigation` prop
// porque no vive dentro de un Stack: usa `onDone` para volver a AppTabs.
export default function SetUsernameScreen({ onDone }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [username, setUsername] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleContinue() {
    const clean = username.trim().toLowerCase();
    if (clean.length < 3) {
      setError('El nombre de usuario debe tener al menos 3 caracteres.');
      return;
    }
    setError(null);
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', clean)
      .neq('id', user.id)
      .maybeSingle();

    if (existing) {
      setError('Ese nombre de usuario ya está en uso. Elige otro.');
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase.from('profiles').update({ username: clean }).eq('id', user.id);

    setSaving(false);

    if (updateError) {
      setError(
        updateError.code === '23505' ? 'Ese nombre de usuario ya está en uso. Elige otro.' : updateError.message
      );
      return;
    }

    onDone();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Elige tu usuario</Text>
      <Text style={styles.subtitulo}>Un último paso — así te van a encontrar otros usuarios en TCGBINDR.</Text>

      <ErrorText>{error}</ErrorText>

      <TextField
        placeholder="tu_usuario"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
        onSubmitEditing={handleContinue}
      />

      <Button title="Continuar" onPress={handleContinue} loading={saving} style={styles.boton} />
    </View>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  titulo: {
    fontSize: 26,
    fontFamily: fonts.extrabold,
    color: colors.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitulo: {
    fontFamily: fonts.regular,
    color: colors.mutedForeground,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  boton: {
    width: '100%',
    marginTop: spacing.sm,
  },
  });
}
