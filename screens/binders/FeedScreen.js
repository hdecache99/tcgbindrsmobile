import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getPublicBinders } from '../../lib/binders';
import { searchCardInCommunity, searchUsers } from '../../lib/discover';
import { getActivityFeed } from '../../lib/activity';
import BinderGridTile from '../../components/binders/BinderGridTile';
import CardInBinderResultItem from '../../components/binders/CardInBinderResultItem';
import UserResultItem from '../../components/UserResultItem';
import NewsList from '../../components/binders/NewsList';
import TextField from '../../components/TextField';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import FieldLabel from '../../components/FieldLabel';
import PillSelector from '../../components/PillSelector';
import AppHeader from '../../components/AppHeader';
import AdBanner from '../../components/AdBanner';
import { useTheme } from '../../lib/ThemeContext';
import { useLanguage } from '../../lib/LanguageContext';
import { fonts, spacing } from '../../theme';

function timeAgo(dateStr, language) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return language === 'en' ? 'just now' : 'ahora mismo';
  if (minutes < 60) return language === 'en' ? `${minutes}m ago` : `hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return language === 'en' ? `${hours}h ago` : `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return language === 'en' ? `${days}d ago` : `hace ${days}d`;
}

export default function FeedScreen({ navigation }) {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const styles = getStyles(colors);

  const [segment, setSegment] = useState('search');

  // --- Buscar ---
  const [binders, setBinders] = useState([]);
  const [bindersLoading, setBindersLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [userResults, setUserResults] = useState([]);
  const [cardResults, setCardResults] = useState([]);

  // --- Actividad ---
  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);

  async function loadBinders() {
    const data = await getPublicBinders();
    setBinders(data);
  }

  useFocusEffect(
    useCallback(() => {
      setBindersLoading(true);
      loadBinders().finally(() => setBindersLoading(false));
    }, [])
  );

  useEffect(() => {
    if (segment === 'activity') {
      setActivityLoading(true);
      getActivityFeed().then((data) => {
        setActivity(data);
        setActivityLoading(false);
      });
    }
  }, [segment]);

  async function onRefresh() {
    setRefreshing(true);
    await loadBinders();
    setRefreshing(false);
  }

  async function handleSearch() {
    if (!query.trim()) return;
    setSearching(true);
    setSearched(true);
    try {
      const [users, cards] = await Promise.all([searchUsers(query), searchCardInCommunity(query)]);
      setUserResults(users);
      setCardResults(cards);
    } finally {
      setSearching(false);
    }
  }

  function clearSearch() {
    setQuery('');
    setSearched(false);
    setUserResults([]);
    setCardResults([]);
  }

  function renderActivityItem(item) {
    const metadata = item.metadata || {};
    const name = item.user?.display_name || item.user?.username || '';

    if (item.action_type === 'add_card') {
      return (
        <Text style={styles.activityText}>
          <Text style={styles.activityName}>{name}</Text> {t('activity_added_card')}{' '}
          <Text style={styles.activityHighlight}>
            {metadata.count > 1 ? `${metadata.count} cartas` : metadata.first_card}
          </Text>
        </Text>
      );
    }
    if (item.action_type === 'create_binder') {
      return (
        <Text style={styles.activityText}>
          <Text style={styles.activityName}>{name}</Text> {t('activity_created_binder')}{' '}
          <Text style={styles.activityHighlight}>{metadata.binder_title}</Text>
        </Text>
      );
    }
    if (item.action_type === 'follow_user') {
      return (
        <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { username: metadata.following_username })}>
          <Text style={styles.activityText}>
            <Text style={styles.activityName}>{name}</Text> {t('activity_followed')}{' '}
            <Text style={styles.activityHighlight}>@{metadata.following_username}</Text>
          </Text>
        </TouchableOpacity>
      );
    }
    return null;
  }

  return (
    <View style={styles.container}>
      <AppHeader navigation={navigation} />

      <View style={styles.segmentBar}>
        <PillSelector
          options={[
            { value: 'search', label: t('feed_search') },
            { value: 'activity', label: t('feed_activity') },
            { value: 'news', label: t('feed_news') },
          ]}
          value={segment}
          onChange={setSegment}
        />
      </View>

      {segment === 'search' ? (
        bindersLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <View style={styles.flex}>
            <View style={styles.searchBar}>
              <TextField
                placeholder="Buscar cartas o usuarios..."
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              <View style={styles.searchButtons}>
                <Button title="Buscar" onPress={handleSearch} loading={searching} style={styles.searchButton} />
                {searched ? (
                  <Button title="Limpiar" variant="secondary" onPress={clearSearch} style={styles.clearButton} />
                ) : null}
              </View>
            </View>

            {searched ? (
              <ScrollView contentContainerStyle={styles.listContent}>
                {userResults.length > 0 ? (
                  <>
                    <FieldLabel>Usuarios</FieldLabel>
                    {userResults.map((u) => (
                      <UserResultItem
                        key={u.id}
                        user={u}
                        onPress={() => navigation.navigate('UserProfile', { username: u.username })}
                      />
                    ))}
                    <View style={styles.spacer} />
                  </>
                ) : null}

                {cardResults.length > 0 ? (
                  <>
                    <FieldLabel>Cartas encontradas</FieldLabel>
                    {cardResults.map((r) => (
                      <CardInBinderResultItem
                        key={r.id}
                        result={r}
                        onPress={() => navigation.navigate('BinderDetail', { binderId: r.binder.id, title: r.binder.title })}
                      />
                    ))}
                  </>
                ) : null}

                {userResults.length === 0 && cardResults.length === 0 ? (
                  <EmptyState message="No encontramos cartas ni usuarios con ese nombre." />
                ) : null}
              </ScrollView>
            ) : (
              <FlatList
                style={styles.flex}
                data={binders}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={<EmptyState message="Todavía no hay binders públicos." />}
                renderItem={({ item }) => (
                  <BinderGridTile
                    binder={item}
                    onPress={() => navigation.navigate('BinderDetail', { binderId: item.id, title: item.title })}
                  />
                )}
              />
            )}
          </View>
        )
      ) : null}

      {segment === 'activity' ? (
        activityLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            style={styles.flex}
            data={activity}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<EmptyState message={t('activity_empty')} />}
            renderItem={({ item }) => (
              <View style={styles.activityItem}>
                {renderActivityItem(item)}
                <Text style={styles.activityTime}>{timeAgo(item.created_at, language)}</Text>
              </View>
            )}
          />
        )
      ) : null}

      {segment === 'news' ? <NewsList /> : null}

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
    flex: {
      flex: 1,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    segmentBar: {
      padding: spacing.lg,
      paddingBottom: spacing.md,
    },
    searchBar: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    searchButtons: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    searchButton: {
      flex: 1,
    },
    clearButton: {
      flex: 1,
    },
    spacer: {
      height: spacing.lg,
    },
    listContent: {
      padding: 16,
    },
    activityItem: {
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    activityText: {
      fontSize: 14,
      color: colors.foreground,
      fontFamily: fonts.regular,
      lineHeight: 20,
    },
    activityName: {
      fontFamily: fonts.bold,
    },
    activityHighlight: {
      fontFamily: fonts.bold,
      color: colors.primary,
    },
    activityTime: {
      fontSize: 11,
      color: colors.mutedForeground,
      marginTop: 4,
    },
  });
}
