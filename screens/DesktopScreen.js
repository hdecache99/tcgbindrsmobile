import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getUserBinders, getPublicBinders } from '../lib/binders';
import CozyRoom from '../components/desktop/CozyRoom';
import BinderGridTile from '../components/binders/BinderGridTile';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import AppHeader from '../components/AppHeader';
import AdBanner from '../components/AdBanner';
import { useTheme } from '../lib/ThemeContext';
import { useLanguage } from '../lib/LanguageContext';
import { fonts, spacing } from '../theme';

const PREVIEW_LIMIT = 6;

const MENU_ITEMS = [
  { icon: 'scan-outline', labelKey: 'menu_scan', screen: 'QuickScanMain' },
  { icon: 'newspaper-outline', labelKey: 'feed_news', screen: 'NewsList' },
  { icon: 'cash-outline', labelKey: 'tab_sales', screen: 'SalesMain' },
  { icon: 'person-circle-outline', labelKey: 'menu_profile', screen: 'ProfileMain' },
  { icon: 'settings-outline', labelKey: 'menu_settings', screen: 'Settings' },
];

// Pantalla raíz post-login: un "cuartito" 2D con perspectiva (no WebGL real
// — más liviano y fácil de afinar) desde donde se llega a las secciones de
// abajo en la misma página (mi binder / binders públicos / menú), en vez de
// navegar a otra pantalla al tocar los muebles del cuarto.
export default function DesktopScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(colors);
  const scrollRef = useRef(null);
  const offsets = useRef({ binder: 0, public: 0, menu: 0 });

  const [myBinders, setMyBinders] = useState([]);
  const [publicBinders, setPublicBinders] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      Promise.all([getUserBinders(), getPublicBinders(PREVIEW_LIMIT)])
        .then(([mine, pub]) => {
          setMyBinders(mine.slice(0, PREVIEW_LIMIT));
          setPublicBinders(pub);
        })
        .finally(() => setLoading(false));
    }, [])
  );

  function scrollToSection(key) {
    scrollRef.current?.scrollTo({ y: Math.max(offsets.current[key] - spacing.lg, 0), animated: true });
  }

  function openBinder(item) {
    navigation.navigate('BinderDetail', { binderId: item.id, title: item.title });
  }

  return (
    <View style={styles.container}>
      <AppHeader navigation={navigation} />

      <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent}>
        <View style={styles.roomWrap}>
          <CozyRoom
            colors={colors}
            isDark={isDark}
            onSelectBinder={() => scrollToSection('binder')}
            onSelectPublic={() => scrollToSection('public')}
            onSelectMenu={() => scrollToSection('menu')}
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loading} />
        ) : (
          <>
            <View
              style={styles.section}
              onLayout={(e) => {
                offsets.current.binder = e.nativeEvent.layout.y;
              }}
            >
              <Text style={styles.sectionTitle}>Mi binder</Text>
              {myBinders.length === 0 ? (
                <EmptyState message="Todavía no tienes binders." />
              ) : (
                <View style={styles.grid}>
                  {myBinders.map((item) => (
                    <View key={item.id} style={styles.gridItem}>
                      <BinderGridTile binder={item} onPress={() => openBinder(item)} />
                    </View>
                  ))}
                </View>
              )}
              <Button title="Nuevo binder" icon="add-outline" onPress={() => navigation.navigate('CreateBinder')} />
            </View>

            <View
              style={styles.section}
              onLayout={(e) => {
                offsets.current.public = e.nativeEvent.layout.y;
              }}
            >
              <Text style={styles.sectionTitle}>Binders públicos</Text>
              {publicBinders.length === 0 ? (
                <EmptyState message="Todavía no hay binders públicos." />
              ) : (
                <View style={styles.grid}>
                  {publicBinders.map((item) => (
                    <View key={item.id} style={styles.gridItem}>
                      <BinderGridTile binder={item} onPress={() => openBinder(item)} />
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View
              style={styles.section}
              onLayout={(e) => {
                offsets.current.menu = e.nativeEvent.layout.y;
              }}
            >
              <Text style={styles.sectionTitle}>Menú</Text>
              <View style={styles.menuGrid}>
                {MENU_ITEMS.map((item) => (
                  <TouchableOpacity
                    key={item.screen}
                    style={styles.menuItem}
                    onPress={() => navigation.navigate(item.screen)}
                  >
                    <Ionicons name={item.icon} size={22} color={colors.primary} />
                    <Text style={styles.menuItemLabel}>{t(item.labelKey)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <AdBanner />
    </View>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingBottom: spacing.xl,
    },
    roomWrap: {
      paddingTop: spacing.lg,
      alignItems: 'center',
    },
    loading: {
      marginTop: spacing.xl,
    },
    section: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
    },
    sectionTitle: {
      fontFamily: fonts.bold,
      fontSize: 18,
      color: colors.foreground,
      marginBottom: spacing.md,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: spacing.md,
    },
    gridItem: {
      width: '50%',
    },
    menuGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    menuItem: {
      width: '30%',
      aspectRatio: 1,
      borderRadius: 16,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
    },
    menuItemLabel: {
      fontFamily: fonts.semibold,
      fontSize: 12,
      color: colors.foreground,
      textAlign: 'center',
    },
  });
}
