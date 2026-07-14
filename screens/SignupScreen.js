import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';
import Button from '../components/Button';
import TextField from '../components/TextField';
import ErrorText from '../components/ErrorText';
import TextLink from '../components/TextLink';
import OAuthButtons from '../components/OAuthButtons';
import { fonts, spacing } from '../theme';
import { useTheme } from '../lib/ThemeContext';

export default function SignupScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSignup() {
    setError(null);

    const cleanUsername = username.trim().toLowerCase();

    if (cleanUsername.length < 3) {
      setError('El nombre de usuario debe tener al menos 3 caracteres.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);

    // Mismo chequeo que hace la web antes de crear la cuenta (profiles es de lectura pública).
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', cleanUsername)
      .maybeSingle();

    if (existing) {
      setError('El nombre de usuario ya está en uso. Por favor, elige otro.');
      setLoading(false);
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: cleanUsername },
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(
        signUpError.code === '23505' // fallback por si dos personas registran el mismo username a la vez
          ? 'El nombre de usuario ya está en uso. Por favor, elige otro.'
          : signUpError.message
      );
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <View style={styles.container}>
        <Text style={styles.titulo}>Revisa tu correo</Text>
        <Text style={styles.subtitulo}>
          Te enviamos un link de confirmación a {email}. Confírmalo para poder iniciar sesión.
        </Text>
        <Button
          title="Volver a Iniciar Sesión"
          onPress={() => navigation.navigate('Login')}
          style={styles.boton}
        />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Crear cuenta</Text>
      <Text style={styles.subtitulo}>Organiza tu colección de TCG</Text>

      <ErrorText>{error}</ErrorText>

      <TextField placeholder="tu_usuario" autoCapitalize="none" value={username} onChangeText={setUsername} />
      <TextField
        placeholder="tu@email.com"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextField
        placeholder="Contraseña (mínimo 6 caracteres)"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Button title="Crear Cuenta" onPress={handleSignup} loading={loading} style={styles.boton} />

      <TextLink title="¿Ya tienes cuenta? Inicia sesión" onPress={() => navigation.navigate('Login')} />

      <OAuthButtons />
    </ScrollView>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
  container: {
    flexGrow: 1,
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
