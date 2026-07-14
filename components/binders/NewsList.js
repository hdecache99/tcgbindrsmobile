import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getLatestNews } from '../../lib/news';
import EmptyState from '../EmptyState';
import PillSelector from '../PillSelector';
import { useTheme } from '../../lib/ThemeContext';
import { useLanguage } from '../../lib/LanguageContext';
import { fonts, spacing } from '../../theme';

// Lista de noticias reutilizada tanto en el segmento "Noticias" del Feed
// como en el tab dedicado de Noticias en la nav bar — misma data/lógica,
// dos puntos de entrada.
export default function NewsList() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(colors);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');

  useEffect(() => {
    getLatestNews().then((data) => {
      setNews(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const categories = ['all', ...new Set(news.map((n) => n.category).filter(Boolean))];
  const filtered = category === 'all' ? news : news.filter((n) => n.category === category);

  return (
    <View style={styles.flex}>
      {categories.length > 1 ? (
        <View style={styles.filterBar}>
          <PillSelector
            options={categories.map((c) => ({ value: c, label: c === 'all' ? 'Todas' : c }))}
            value={category}
            onChange={setCategory}
          />
        </View>
      ) : null}

      <FlatList
        style={styles.flex}
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<EmptyState message={t('news_empty')} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => Linking.openURL(item.source_url)}>
            {item.image_url ? <Image source={{ uri: item.image_url }} style={styles.image} /> : null}
            <View style={styles.body}>
              {item.category ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.category}</Text>
                </View>
              ) : null}
              <Text style={styles.title} numberOfLines={2}>
                {item.title}
              </Text>
              <View style={styles.linkRow}>
                <Ionicons name="open-outline" size={14} color={colors.mutedForeground} />
                <Text style={styles.linkText}>Leer más</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
    flex: {
      flex: 1,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterBar: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
    },
    listContent: {
      padding: 16,
    },
    card: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: 16,
      marginBottom: spacing.md,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    image: {
      width: 88,
      height: 88,
    },
    body: {
      flex: 1,
      padding: spacing.md,
      justifyContent: 'center',
    },
    badge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.muted,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 2,
      marginBottom: 4,
    },
    badgeText: {
      fontSize: 10,
      color: colors.primary,
      textTransform: 'uppercase',
      fontFamily: fonts.bold,
    },
    title: {
      fontSize: 14,
      fontFamily: fonts.bold,
      color: colors.foreground,
    },
    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 6,
    },
    linkText: {
      fontSize: 11,
      color: colors.mutedForeground,
    },
  });
}
