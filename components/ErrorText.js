import { StyleSheet, Text } from 'react-native';
import { fonts, spacing } from '../theme';
import { useTheme } from '../lib/ThemeContext';

export default function ErrorText({ children }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  if (!children) return null;
  return <Text style={styles.text}>{children}</Text>;
}

function getStyles(colors) {
  return StyleSheet.create({
  text: {
    color: colors.danger,
    fontFamily: fonts.medium,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  });
}
