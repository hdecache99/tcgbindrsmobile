import { StyleSheet, Text, View } from 'react-native';
import { fonts } from '../theme';
import { useTheme } from '../lib/ThemeContext';

export default function EmptyState({ message }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  text: {
    color: colors.mutedForeground,
    fontFamily: fonts.regular,
  },
  });
}
