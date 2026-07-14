import { useEffect, useRef, useState } from 'react';
import { Animated, Image, Linking, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useTheme } from '../lib/ThemeContext';
import { useLanguage } from '../lib/LanguageContext';
import { fonts, radius, spacing } from '../theme';

const PANEL_WIDTH = 260;
const ANIM_DURATION = 200;

// Mismas redes que el footer de la web (src/components/Footer.tsx) — el
// handle de TikTok es "tgcbindrs" tal cual está registrado, no un typo a
// corregir.
const SOCIAL_LINKS = [
  { icon: 'logo-instagram', url: 'https://www.instagram.com/tcgbindrs/', label: 'Instagram' },
  { icon: 'logo-tiktok', url: 'https://www.tiktok.com/@tgcbindrs', label: 'TikTok' },
  { icon: 'logo-facebook', url: 'https://www.facebook.com/profile.php?id=61570759494368', label: 'Facebook' },
];

export default function HamburgerMenu({ visible, onClose, navigation }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors, insets);
  const translateX = useRef(new Animated.Value(-PANEL_WIDTH)).current;
  // El Modal se mantiene montado durante la animación de cierre — si su
  // `visible` siguiera 1:1 al prop `visible`, RN desmonta el Modal nativo en
  // el mismo frame en que empieza a cerrar, cortando la animación a la mitad
  // y dando esa sensación de lag/tirón.
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(translateX, { toValue: 0, duration: ANIM_DURATION, useNativeDriver: true }).start();
    } else {
      Animated.timing(translateX, { toValue: -PANEL_WIDTH, duration: ANIM_DURATION, useNativeDriver: true }).start(
        ({ finished }) => {
          if (finished) setMounted(false);
        }
      );
    }
  }, [visible]);

  function go(screen, params) {
    onClose();
    navigation.navigate(screen, params);
  }

  async function handleLogout() {
    onClose();
    await supabase.auth.signOut();
  }

  const items = [
    { icon: 'albums-outline', label: t('menu_my_binders'), onPress: () => go('Binders') },
    { icon: 'compass-outline', label: t('tab_feed'), onPress: () => go('Feed') },
    { icon: 'newspaper-outline', label: t('feed_news'), onPress: () => go('Noticias') },
    { icon: 'cash-outline', label: t('tab_sales'), onPress: () => go('Ventas') },
    { icon: 'person-circle-outline', label: t('menu_profile'), onPress: () => go('Perfil') },
    { icon: 'settings-outline', label: t('menu_settings'), onPress: () => go('Settings') },
  ];

  if (!mounted) return null;

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <Animated.View style={[styles.panel, { transform: [{ translateX }] }]}>
          <Image source={require('../assets/brand/header-v2.png')} style={styles.panelLogo} resizeMode="contain" />

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {items.map((item) => (
              <TouchableOpacity key={item.label} style={styles.item} onPress={item.onPress}>
                <Ionicons name={item.icon} size={20} color={colors.foreground} style={styles.itemIcon} />
                <Text style={styles.itemLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.scanButton} onPress={() => go('Escanear')}>
              <Ionicons name="scan-outline" size={28} color="#fff" />
              <Text style={styles.scanButtonText}>{t('menu_scan')}</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <Text style={styles.sectionLabel}>{t('menu_follow_us')}</Text>
            <View style={styles.socialRow}>
              {SOCIAL_LINKS.map((link) => (
                <TouchableOpacity
                  key={link.label}
                  style={styles.socialButton}
                  onPress={() => Linking.openURL(link.url)}
                >
                  <Ionicons name={link.icon} size={20} color={colors.foreground} />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.item} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color={colors.danger} style={styles.itemIcon} />
              <Text style={[styles.itemLabel, { color: colors.danger }]}>{t('menu_logout')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function getStyles(colors, insets) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      flexDirection: 'row',
    },
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    panel: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: PANEL_WIDTH,
      backgroundColor: colors.card,
      paddingTop: insets.top + spacing.xl,
      paddingHorizontal: spacing.lg,
    },
    panelLogo: {
      width: 160,
      height: 46,
      marginBottom: spacing.xl,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: spacing.xl,
    },
    sectionLabel: {
      fontFamily: fonts.semibold,
      fontSize: 11,
      color: colors.mutedForeground,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.sm,
    },
    socialRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    socialButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.muted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
    },
    itemIcon: {
      marginRight: spacing.md,
    },
    itemLabel: {
      fontFamily: fonts.semibold,
      fontSize: 15,
      color: colors.foreground,
    },
    scanButton: {
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      backgroundColor: colors.primary,
      borderRadius: radius.lg,
      width: '100%',
      paddingVertical: spacing.lg,
      marginTop: spacing.lg,
      shadowColor: colors.primary,
      shadowOpacity: 0.35,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
    scanButtonText: {
      fontFamily: fonts.bold,
      fontSize: 15,
      color: '#fff',
      marginTop: spacing.xs,
    },
    divider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginVertical: spacing.md,
    },
  });
}
