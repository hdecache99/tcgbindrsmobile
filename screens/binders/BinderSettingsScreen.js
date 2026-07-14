import { useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { deleteBinder, updateBinder } from '../../lib/binders';
import { VISIBILITY_OPTIONS } from '../../constants/visibility';
import { THEME_COLOR_PRESETS, INTRO_ANIMATION_OPTIONS } from '../../constants/binderTheme';
import BinderIntro from '../../components/binders/BinderIntro';
import ColorPicker from '../../components/ColorPicker';
import Button from '../../components/Button';
import TextField from '../../components/TextField';
import ErrorText from '../../components/ErrorText';
import PillSelector from '../../components/PillSelector';
import FieldLabel from '../../components/FieldLabel';
import { radius, spacing } from '../../theme';
import { useTheme } from '../../lib/ThemeContext';

export default function BinderSettingsScreen({ route, navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { binder } = route.params;
  const [title, setTitle] = useState(binder.title);
  const [description, setDescription] = useState(binder.description || '');
  const [visibility, setVisibility] = useState(binder.visibility);
  const [themeColor, setThemeColor] = useState(binder.theme_color || null);
  const isPresetColor = !themeColor || THEME_COLOR_PRESETS.some((p) => p.value === themeColor);
  const [customOpen, setCustomOpen] = useState(!isPresetColor);
  const [introAnimation, setIntroAnimation] = useState(binder.intro_animation || 'fade');
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (title.trim().length < 1) {
      setError('El título es obligatorio.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await updateBinder(binder.id, {
        title: title.trim(),
        description: description.trim() || null,
        visibility,
        theme_color: themeColor,
        intro_animation: introAnimation,
      });
      navigation.navigate('BindersList');
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  function confirmDelete() {
    Alert.alert('Eliminar binder', `¿Eliminar "${binder.title}" y todas sus cartas? Esta acción no se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await deleteBinder(binder.id);
          navigation.navigate('BindersList');
        },
      },
    ]);
  }

  return (
    <View style={styles.flexFill}>
      <ScrollView contentContainerStyle={styles.container}>
      <ErrorText>{error}</ErrorText>

      <TextField label="Título" value={title} onChangeText={setTitle} />
      <TextField label="Descripción (opcional)" value={description} onChangeText={setDescription} multiline style={styles.textArea} />

      <FieldLabel>Visibilidad</FieldLabel>
      <PillSelector options={VISIBILITY_OPTIONS} value={visibility} onChange={setVisibility} />

      <View style={styles.section}>
        <FieldLabel>Color de tema</FieldLabel>
        <View style={styles.swatchRow}>
          <TouchableOpacity
            style={[styles.swatch, styles.swatchNone, !themeColor && styles.swatchSelected]}
            onPress={() => {
              setThemeColor(null);
              setCustomOpen(false);
            }}
          >
            <View style={styles.swatchNoneSlash} />
          </TouchableOpacity>
          {THEME_COLOR_PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset.value}
              style={[
                styles.swatch,
                { backgroundColor: preset.value },
                themeColor === preset.value && styles.swatchSelected,
              ]}
              onPress={() => {
                setThemeColor(preset.value);
                setCustomOpen(false);
              }}
            />
          ))}

          <TouchableOpacity
            style={[styles.swatch, styles.swatchCustom, customOpen && styles.swatchSelected]}
            onPress={() => setCustomOpen((o) => !o)}
          >
            <Ionicons name="color-palette-outline" size={18} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {customOpen ? (
          <View style={styles.customPicker}>
            <ColorPicker value={isPresetColor ? null : themeColor} onChange={setThemeColor} />
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <FieldLabel>Animación de portada</FieldLabel>
        <PillSelector options={INTRO_ANIMATION_OPTIONS} value={introAnimation} onChange={setIntroAnimation} columns={2} />
        <Button
          title="Vista previa"
          icon="play-outline"
          variant="secondary"
          compact
          onPress={() => setPreviewing(true)}
          style={styles.previewButton}
        />
      </View>

      <Button title="Guardar cambios" onPress={handleSave} loading={saving} style={styles.saveButton} />
      <Button title="Eliminar binder" variant="secondary" textColor={colors.danger} onPress={confirmDelete} />
      </ScrollView>

      {previewing ? (
        <BinderIntro
          type={introAnimation}
          title={title}
          username={binder.owner?.username}
          themeColor={themeColor}
          cardCount={binder.card_count}
          onComplete={() => setPreviewing(false)}
        />
      ) : null}
    </View>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
  flexFill: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  section: {
    marginTop: spacing.lg,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchNone: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchNoneSlash: {
    width: 1.5,
    height: 24,
    backgroundColor: colors.mutedForeground,
    transform: [{ rotate: '45deg' }],
  },
  swatchSelected: {
    borderColor: colors.primary,
  },
  swatchCustom: {
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customPicker: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewButton: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },
  saveButton: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  });
}
