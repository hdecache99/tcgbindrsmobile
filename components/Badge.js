import { StyleSheet, Text, View } from 'react-native';
import { fonts, radius } from '../theme';

export default function Badge({ label, color, backgroundColor }) {
  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
  },
  text: {
    fontSize: 12,
    fontFamily: fonts.semibold,
  },
});


