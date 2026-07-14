import { useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/ThemeContext';
import { spacing } from '../theme';
import HamburgerMenu from './HamburgerMenu';

export default function AppHeader({ navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors, insets);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setMenuOpen(true)} hitSlop={12}>
        <Ionicons name="menu" size={26} color={colors.foreground} />
      </TouchableOpacity>

      <View style={styles.logoWrap}>
        <Image source={require('../assets/brand/header-v2.png')} style={styles.logo} resizeMode="contain" />
      </View>

      <View style={styles.spacer} />

      <HamburgerMenu visible={menuOpen} onClose={() => setMenuOpen(false)} navigation={navigation} />
    </View>
  );
}

function getStyles(colors, insets) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: insets.top + spacing.md,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    logoWrap: {
      flex: 1,
      alignItems: 'center',
    },
    logo: {
      height: 28,
      width: 99,
    },
    spacer: {
      width: 26,
    },
  });
}
