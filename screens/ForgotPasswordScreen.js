import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';
import Button from '../components/Button';
import TextField from '../components/TextField';
import ErrorText from '../components/ErrorText';
import TextLink from '../components/TextLink';
import { fonts, spacing } from '../theme';
import { useTheme } from '../lib/ThemeContext';

export default function ForgotPasswordScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <View style={styles.container}>
        <Text style={styles.titulo}>Revisa tu correo</Text>
        <Text style={styles.subtitulo}>
          Te enviamos un link a {email} para restablecer tu contraseña. Ábrelo desde tu correo para continuar.
        </Text>
        <Button title="Volver a Iniciar Sesión" onPress={() => navigation.navigate('Login')} style={styles.boton} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>¿Olvidaste tu contraseña?</Text>
      <Text style={styles.subtitulo}>Te enviamos un link para restablecerla.</Text>

      <ErrorText>{error}</ErrorText>

      <TextField
        placeholder="tu@email.com"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <Button title="Enviar link" onPress={handleSend} loading={loading} style={styles.boton} />

      <TextLink title="Volver a Iniciar Sesión" onPress={() => navigation.navigate('Login')} />
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
    fontSize: 22,
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
