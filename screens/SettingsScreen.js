import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/ThemeContext';
import { useLanguage } from '../lib/LanguageContext';
import { showPrivacyOptionsForm } from '../lib/ads';
import PillSelector from '../components/PillSelector';
import FieldLabel from '../components/FieldLabel';
import { fonts, spacing } from '../theme';

const LANGUAGE_OPTIONS = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
];

const WEB_BASE_URL = 'https://www.tcgbindrs.com';

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const styles = getStyles(colors);
  const [openingPrivacyOptions, setOpeningPrivacyOptions] = useState(false);

  async function handlePrivacyOptions() {
    setOpeningPrivacyOptions(true);
    try {
      const shown = await showPrivacyOptionsForm();
      if (!shown) {
        // Fuera de una región regulada (GDPR/UK/California) Google no exige
        // este formulario — no hay nada que ajustar para este usuario.
      }
    } catch (err) {
      console.warn('[settings] privacy options form failed:', err.message);
    } finally {
      setOpeningPrivacyOptions(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{t('settings_dark_mode')}</Text>
        <Switch
          value={isDark}
          onValueChange={toggleTheme}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="#fff"
        />
      </View>

      <View style={styles.section}>
        <FieldLabel>{t('settings_language')}</FieldLabel>
        <PillSelector options={LANGUAGE_OPTIONS} value={language} onChange={setLanguage} />
      </View>

      <View style={styles.section}>
        <FieldLabel>Privacidad y legal</FieldLabel>

        <TouchableOpacity style={styles.linkRow} onPress={handlePrivacyOptions} disabled={openingPrivacyOptions}>
          <Text style={styles.linkLabel}>Opciones de privacidad de anuncios</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL(`${WEB_BASE_URL}/privacy`)}>
          <Text style={styles.linkLabel}>Política de privacidad</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL(`${WEB_BASE_URL}/terms`)}>
          <Text style={styles.linkLabel}>Términos de servicio</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: spacing.lg,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: spacing.lg,
    },
    rowLabel: {
      fontFamily: fonts.semibold,
      fontSize: 15,
      color: colors.foreground,
    },
    section: {
      marginTop: spacing.sm,
    },
    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    linkLabel: {
      fontFamily: fonts.medium,
      fontSize: 14,
      color: colors.foreground,
    },
  });
}
