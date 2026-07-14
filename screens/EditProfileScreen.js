import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { getProfile, updateProfile } from '../lib/profile';
import { moderateAvatar, uploadAvatar } from '../lib/avatar';
import { useCurrency } from '../lib/CurrencyContext';
import { supabase } from '../lib/supabase';
import { CURRENCY_OPTIONS } from '../constants/currency';
import { THEME_COLOR_PRESETS } from '../constants/binderTheme';
import Button from '../components/Button';
import TextField from '../components/TextField';
import FieldLabel from '../components/FieldLabel';
import PillSelector from '../components/PillSelector';
import ErrorText from '../components/ErrorText';
import ColorPicker from '../components/ColorPicker';
import DeleteAccountModal from '../components/DeleteAccountModal';
import { fonts, radius, spacing } from '../theme';
import { useTheme } from '../lib/ThemeContext';

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { refreshCurrency } = useCurrency();
  const [profile, setProfile] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [country, setCountry] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [shippingMethods, setShippingMethods] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarStatus, setAvatarStatus] = useState('idle'); // idle | checking | uploading
  const [bannerColor, setBannerColor] = useState('#581c87');
  const isPresetColor = THEME_COLOR_PRESETS.some((p) => p.value === bannerColor);
  const [customColorOpen, setCustomColorOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      getProfile().then((data) => {
        if (!active) return;
        setProfile(data);
        setDisplayName(data.display_name || '');
        setWhatsapp(data.whatsapp_e164 || '');
        setCountry(data.country || '');
        setCurrency(data.currency || 'USD');
        setShippingMethods(data.shipping_methods || '');
        setAvatarUrl(data.avatar_url || null);
        setBannerColor(data.banner_color || '#581c87');
        setCustomColorOpen(!THEME_COLOR_PRESETS.some((p) => p.value === (data.banner_color || '#581c87')));
        setLoading(false);
      });
      return () => {
        active = false;
      };
    }, [])
  );

  async function processAvatar(uri) {
    setError(null);
    setAvatarStatus('checking');
    try {
      const { safe, reason } = await moderateAvatar(uri);
      if (!safe) {
        setError(reason || 'Esta imagen no es apropiada para tu foto de perfil.');
        setAvatarStatus('idle');
        return;
      }

      setAvatarStatus('uploading');
      const publicUrl = await uploadAvatar(uri);
      await updateProfile({ avatar_url: publicUrl });
      setAvatarUrl(publicUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setAvatarStatus('idle');
    }
  }

  async function handleTakeAvatarPhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setError('Necesitas dar permiso de cámara.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true, aspect: [1, 1] });
    if (result.canceled) return;
    await processAvatar(result.assets[0].uri);
  }

  async function handlePickAvatarFromGallery() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError('Necesitas dar permiso para acceder a tus fotos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled) return;
    await processAvatar(result.assets[0].uri);
  }

  function handleChangeAvatar() {
    Alert.alert('Foto de perfil', '¿Cómo quieres elegir tu foto?', [
      { text: 'Tomar foto', onPress: handleTakeAvatarPhoto },
      { text: 'Elegir de galería', onPress: handlePickAvatarFromGallery },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  async function handleSave() {
    setError(null);
    setMessage(null);

    // Igual que la web: solo se guardan dígitos (la columna en la DB no acepta el "+").
    const cleanedWhatsapp = whatsapp.replace(/\D/g, '');
    if (cleanedWhatsapp && (cleanedWhatsapp.length < 7 || cleanedWhatsapp.length > 15)) {
      setError('Formato de WhatsApp inválido (debe tener entre 7 y 15 dígitos).');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        display_name: displayName,
        whatsapp_e164: cleanedWhatsapp || null,
        country: country || null,
        currency,
        shipping_methods: shippingMethods || null,
        banner_color: bannerColor,
      });
      await refreshCurrency();
      setMessage('Perfil actualizado.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const avatarBusy = avatarStatus !== 'idle';
  const avatarLetter = (profile.display_name || profile.username).charAt(0).toUpperCase();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.avatarWrap}>
        <TouchableOpacity style={styles.avatar} onPress={handleChangeAvatar} disabled={avatarBusy}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarLetter}>{avatarLetter}</Text>
          )}
          <View style={styles.avatarOverlay}>
            {avatarBusy ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="camera-outline" size={20} color="#fff" />
            )}
          </View>
        </TouchableOpacity>
        <Text style={styles.avatarHint}>
          {avatarStatus === 'checking' ? 'Verificando imagen…' : avatarStatus === 'uploading' ? 'Subiendo…' : 'Toca para cambiar tu foto'}
        </Text>
      </View>

      <Text style={styles.username}>@{profile.username}</Text>

      {message ? <Text style={styles.message}>{message}</Text> : null}
      <ErrorText>{error}</ErrorText>

      <TextField label="Nombre para mostrar" value={displayName} onChangeText={setDisplayName} />

      <TextField
        label="WhatsApp (para vender cartas)"
        value={whatsapp}
        onChangeText={setWhatsapp}
        placeholder="50688887777"
        keyboardType="phone-pad"
      />

      <TextField label="País" value={country} onChangeText={setCountry} placeholder="Costa Rica" />

      <FieldLabel>Moneda</FieldLabel>
      <View style={styles.currencyPicker}>
        <PillSelector options={CURRENCY_OPTIONS} value={currency} onChange={setCurrency} />
      </View>

      <FieldLabel>Color de tu perfil</FieldLabel>
      <View style={styles.swatchRow}>
        {THEME_COLOR_PRESETS.map((preset) => (
          <TouchableOpacity
            key={preset.value}
            style={[styles.swatch, { backgroundColor: preset.value }, bannerColor === preset.value && styles.swatchSelected]}
            onPress={() => {
              setBannerColor(preset.value);
              setCustomColorOpen(false);
            }}
          />
        ))}
        <TouchableOpacity
          style={[styles.swatch, styles.swatchCustom, customColorOpen && styles.swatchSelected]}
          onPress={() => setCustomColorOpen((o) => !o)}
        >
          <Ionicons name="color-palette-outline" size={18} color={colors.foreground} />
        </TouchableOpacity>
      </View>
      {customColorOpen ? (
        <View style={styles.customColorPicker}>
          <ColorPicker value={isPresetColor ? null : bannerColor} onChange={setBannerColor} />
        </View>
      ) : null}

      <TextField
        label="Métodos de envío (opcional)"
        value={shippingMethods}
        onChangeText={setShippingMethods}
        multiline
        style={styles.textArea}
        placeholder="Correos de Costa Rica, entrega en persona en San José..."
      />

      <Button title="Guardar" onPress={handleSave} loading={saving} style={styles.boton} />

      <Button
        title="Cerrar sesión"
        onPress={() => supabase.auth.signOut()}
        style={styles.signOutBoton}
        textColor={colors.danger}
      />

      <TouchableOpacity style={styles.deleteAccountLink} onPress={() => setDeleteModalOpen(true)}>
        <Text style={styles.deleteAccountText}>Eliminar mi cuenta</Text>
      </TouchableOpacity>

      <DeleteAccountModal
        visible={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        username={profile.username}
      />
    </ScrollView>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: colors.background,
    flexGrow: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  avatarWrap: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarLetter: {
    color: '#fff',
    fontFamily: fonts.extrabold,
    fontSize: 32,
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: spacing.sm,
  },
  username: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.foreground,
    marginBottom: spacing.xl,
  },
  message: {
    color: colors.primary,
    fontFamily: fonts.medium,
    marginBottom: spacing.md,
  },
  currencyPicker: {
    marginBottom: spacing.md,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchSelected: {
    borderColor: colors.primary,
  },
  swatchCustom: {
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customColorPicker: {
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  boton: {
    marginTop: spacing.lg,
  },
  signOutBoton: {
    backgroundColor: 'transparent',
    marginTop: spacing.sm,
  },
  deleteAccountLink: {
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  deleteAccountText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.danger,
    textDecorationLine: 'underline',
  },
  });
}
