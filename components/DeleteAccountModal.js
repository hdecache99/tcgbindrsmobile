import { useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { deleteAccount } from '../lib/account';
import TextField from './TextField';
import Button from './Button';
import { useTheme } from '../lib/ThemeContext';
import { fonts, radius, spacing } from '../theme';

// Requerido por Google Play / App Store: cualquier app con registro de
// cuenta debe ofrecer una forma de eliminarla, no solo cerrar sesión. Pide
// escribir el username exacto antes de confirmar — es irreversible.
export default function DeleteAccountModal({ visible, onClose, username }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const canConfirm = confirmText === username;

  function handleClose() {
    setConfirmText('');
    setError(null);
    onClose();
  }

  async function handleDelete() {
    if (!canConfirm) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteAccount();
      // deleteAccount() ya cerró sesión — RootNavigator cambia a AuthStack solo.
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.titleRow}>
            <Ionicons name="warning" size={20} color={colors.danger} />
            <Text style={styles.title}>Eliminar cuenta</Text>
          </View>
          <Text style={styles.hint}>
            Esto borra tu cuenta, todos tus binders, cartas, ventas registradas y seguidores de forma permanente. No se puede deshacer.
          </Text>
          <Text style={styles.confirmLabel}>
            Escribe <Text style={styles.confirmUsername}>{username}</Text> para confirmar:
          </Text>
          <TextField value={confirmText} onChangeText={setConfirmText} placeholder={username} editable={!deleting} />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Button title="Cancelar" variant="secondary" onPress={handleClose} disabled={deleting} style={styles.actionButton} />
            <Button
              title="Eliminar definitivamente"
              onPress={handleDelete}
              loading={deleting}
              disabled={!canConfirm}
              style={[styles.actionButton, styles.deleteButton]}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      padding: spacing.lg,
      paddingBottom: spacing.xl,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    title: {
      fontFamily: fonts.bold,
      fontSize: 16,
      color: colors.danger,
    },
    hint: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: colors.mutedForeground,
      textAlign: 'center',
      marginBottom: spacing.md,
      lineHeight: 18,
    },
    confirmLabel: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: colors.mutedForeground,
      marginBottom: spacing.sm,
    },
    confirmUsername: {
      fontFamily: fonts.bold,
      color: colors.foreground,
    },
    error: {
      color: colors.danger,
      fontFamily: fonts.medium,
      fontSize: 12,
      textAlign: 'center',
      marginTop: spacing.sm,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    actionButton: {
      flex: 1,
    },
    deleteButton: {
      backgroundColor: colors.danger,
    },
  });
}
