import { StyleSheet, Text } from 'react-native';
import { fonts, spacing } from '../theme';
import { useTheme } from '../lib/ThemeContext';

export default function FieldLabel({ children }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return <Text style={styles.label}>{children}</Text>;
}

function getStyles(colors) {
  return StyleSheet.create({
  label: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  });
}
