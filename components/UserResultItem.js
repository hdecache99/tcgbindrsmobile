import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { fonts, radius, spacing } from '../theme';
import { useTheme } from '../lib/ThemeContext';

export default function UserResultItem({ user, onPress }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <Text style={styles.name}>{user.display_name || user.username}</Text>
      <Text style={styles.username}>@{user.username}</Text>
    </TouchableOpacity>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
  row: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  name: {
    fontFamily: fonts.semibold,
    color: colors.foreground,
    fontSize: 14,
  },
  username: {
    fontFamily: fonts.regular,
    color: colors.primary,
    fontSize: 12,
    marginTop: 2,
  },
  });
}
