import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fonts, radius, spacing } from '../../theme';
import { useTheme } from '../../lib/ThemeContext';

export default function SetListItem({ set, onPress }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {set.name}
        </Text>
        {set.totalCards ? <Text style={styles.meta}>{set.totalCards} cartas</Text> : null}
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  info: {
    flex: 1,
  },
  name: {
    fontFamily: fonts.semibold,
    color: colors.foreground,
    fontSize: 14,
  },
  meta: {
    fontFamily: fonts.regular,
    color: colors.mutedForeground,
    fontSize: 12,
    marginTop: 2,
  },
  chevron: {
    fontSize: 20,
    color: colors.mutedForeground,
  },
  });
}
