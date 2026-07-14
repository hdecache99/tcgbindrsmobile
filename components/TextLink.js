import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { fonts, spacing } from '../theme';
import { useTheme } from '../lib/ThemeContext';

export default function TextLink({ title, onPress, style }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <TouchableOpacity onPress={onPress}>
      <Text style={[styles.text, style]}>{title}</Text>
    </TouchableOpacity>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
  text: {
    color: colors.primary,
    fontFamily: fonts.semibold,
    marginTop: spacing.lg,
  },
  });
}
