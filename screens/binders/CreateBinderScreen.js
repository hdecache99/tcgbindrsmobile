import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { createBinder } from '../../lib/binders';
import { VISIBILITY_OPTIONS } from '../../constants/visibility';
import Button from '../../components/Button';
import TextField from '../../components/TextField';
import ErrorText from '../../components/ErrorText';
import PillSelector from '../../components/PillSelector';
import FieldLabel from '../../components/FieldLabel';
import { spacing } from '../../theme';
import { useTheme } from '../../lib/ThemeContext';

export default function CreateBinderScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('private');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (title.trim().length < 1) {
      setError('El título es obligatorio.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await createBinder({ title, description, visibility });
      navigation.goBack();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <ErrorText>{error}</ErrorText>

      <TextField label="Título" value={title} onChangeText={setTitle} placeholder="Mi colección Pokémon" />

      <TextField
        label="Descripción (opcional)"
        value={description}
        onChangeText={setDescription}
        multiline
        style={styles.textArea}
        placeholder="..."
      />

      <FieldLabel>Visibilidad</FieldLabel>
      <PillSelector options={VISIBILITY_OPTIONS} value={visibility} onChange={setVisibility} />

      <Button title="Crear binder" onPress={handleCreate} loading={loading} style={styles.boton} />
    </View>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  boton: {
    marginTop: spacing.xl,
  },
  });
}
