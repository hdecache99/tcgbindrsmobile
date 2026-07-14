import { StyleSheet, TextInput, View } from 'react-native';
import { fonts, radius, spacing } from '../theme';
import { useTheme } from '../lib/ThemeContext';
import FieldLabel from './FieldLabel';

export default function TextField({ label, style, containerStyle, ...inputProps }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <TextInput style={[styles.input, style]} placeholderTextColor={colors.placeholder} {...inputProps} />
    </View>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: spacing.md,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    color: colors.foreground,
    fontFamily: fonts.regular,
    fontSize: 15,
  },
  });
}
