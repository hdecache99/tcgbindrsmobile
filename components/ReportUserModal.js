import { useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { reportUser } from '../lib/reports';
import PillSelector from './PillSelector';
import TextField from './TextField';
import Button from './Button';
import { useTheme } from '../lib/ThemeContext';
import { fonts, radius, spacing } from '../theme';

const REASON_OPTIONS = [
  { value: 'inappropriate_content', label: 'Contenido inapropiado' },
  { value: 'harassment', label: 'Acoso' },
  { value: 'spam', label: 'Spam' },
  { value: 'other', label: 'Otro' },
];

export default function ReportUserModal({ visible, onClose, reportedUserId }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [reason, setReason] = useState('inappropriate_content');
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit() {
    setSending(true);
    setError(null);
    try {
      await reportUser(reportedUserId, reason, details);
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  function handleClose() {
    setSent(false);
    setError(null);
    setDetails('');
    setReason('inappropriate_content');
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {sent ? (
            <>
              <Text style={styles.title}>Gracias por tu reporte</Text>
              <Text style={styles.hint}>Vamos a revisarlo lo antes posible.</Text>
              <Button title="Cerrar" onPress={handleClose} style={styles.submitButton} />
            </>
          ) : (
            <>
              <Text style={styles.title}>Reportar usuario</Text>
              <PillSelector options={REASON_OPTIONS} value={reason} onChange={setReason} columns={2} />
              <View style={styles.spacer} />
              <TextField
                label="Detalles (opcional)"
                value={details}
                onChangeText={setDetails}
                multiline
                placeholder="Cuéntanos qué pasó..."
                style={styles.detailsInput}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <View style={styles.actions}>
                <Button title="Cancelar" variant="secondary" onPress={handleClose} style={styles.actionButton} />
                <Button title="Enviar" onPress={handleSubmit} loading={sending} style={styles.actionButton} />
              </View>
            </>
          )}
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
    title: {
      fontFamily: fonts.bold,
      fontSize: 16,
      color: colors.foreground,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    hint: {
      fontFamily: fonts.regular,
      color: colors.mutedForeground,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    spacer: {
      height: spacing.md,
    },
    detailsInput: {
      minHeight: 70,
      textAlignVertical: 'top',
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
      marginTop: spacing.md,
    },
    actionButton: {
      flex: 1,
    },
    submitButton: {
      marginTop: spacing.md,
    },
  });
}
