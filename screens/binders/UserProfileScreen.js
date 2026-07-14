import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPublicBindersByUsername } from '../../lib/binders';
import { followUser, unfollowUser, isFollowing } from '../../lib/follows';
import { supabase } from '../../lib/supabase';
import BinderGridTile from '../../components/binders/BinderGridTile';
import EmptyState from '../../components/EmptyState';
import TextField from '../../components/TextField';
import ReportUserModal from '../../components/ReportUserModal';
import ProfileHeader from '../../components/ProfileHeader';
import { spacing } from '../../theme';
import { useTheme } from '../../lib/ThemeContext';
import { useLanguage } from '../../lib/LanguageContext';

// Perfil de OTRO usuario — usa el mismo ProfileHeader (banner + avatar +
// badges + stats) que ProfileScreen.js para el perfil propio, para que ambos
// se vean igual; debajo van los botones de seguir/WhatsApp/reportar que solo
// aplican a un perfil ajeno.
export default function UserProfileScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(colors);
  const { username } = route.params;
  const [owner, setOwner] = useState(null);
  const [binders, setBinders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    getPublicBindersByUsername(username).then(async (result) => {
      setOwner(result.owner);
      setBinders(result.binders);
      navigation.setOptions({ title: `@${result.owner.username}` });

      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);
      if (user && user.id !== result.owner.id) {
        setFollowing(await isFollowing(result.owner.id));
      }

      setLoading(false);
    });
  }, [username]);

  function handleWhatsApp() {
    const message = `¡Hola @${owner.username}! Vi tu perfil en TCGBINDR.`;
    const url = `https://wa.me/${owner.whatsapp_e164.replace('+', '')}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url);
  }

  async function handleToggleFollow() {
    setFollowLoading(true);
    try {
      if (following) {
        await unfollowUser(owner.id);
        setFollowing(false);
      } else {
        await followUser(owner.id);
        setFollowing(true);
      }
    } finally {
      setFollowLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const totalCards = binders.reduce((sum, b) => sum + b.card_count, 0);
  const filteredBinders = search.trim()
    ? binders.filter((b) => b.title?.toLowerCase().includes(search.trim().toLowerCase()))
    : binders;

  const showFollow = currentUserId && currentUserId !== owner.id;

  return (
    <>
    <FlatList
      style={styles.container}
      data={filteredBinders}
      keyExtractor={(item) => item.id}
      numColumns={2}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        <View style={styles.header}>
          <ProfileHeader
            avatarUrl={owner.avatar_url}
            displayName={owner.display_name}
            username={owner.username}
            bannerColor={owner.banner_color}
            stats={[
              { value: binders.length, label: 'Binders' },
              { value: totalCards, label: 'Cartas' },
            ]}
          />

          <View style={styles.actionsRow}>
            {showFollow ? (
              <TouchableOpacity
                style={[styles.waIconButton, following ? styles.followingButton : styles.followButton]}
                onPress={handleToggleFollow}
                disabled={followLoading}
              >
                {followLoading ? (
                  <ActivityIndicator size="small" color={following ? colors.primary : '#fff'} />
                ) : (
                  <Ionicons
                    name={following ? 'person-remove-outline' : 'person-add-outline'}
                    size={20}
                    color={following ? colors.primary : '#fff'}
                  />
                )}
              </TouchableOpacity>
            ) : null}

            {owner.whatsapp_e164 ? (
              <TouchableOpacity style={styles.waIconButton} onPress={handleWhatsApp}>
                <Ionicons name="logo-whatsapp" size={22} color="#fff" />
              </TouchableOpacity>
            ) : null}

            {showFollow ? (
              <TouchableOpacity
                style={[styles.waIconButton, styles.reportButton]}
                onPress={() => setReportOpen(true)}
              >
                <Ionicons name="flag-outline" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            ) : null}
          </View>

          {binders.length > 1 ? (
            <TextField
              placeholder={t('search_binders_placeholder')}
              value={search}
              onChangeText={setSearch}
              containerStyle={styles.searchField}
            />
          ) : null}
        </View>
      }
      ListEmptyComponent={<EmptyState message="Este usuario no tiene binders públicos." />}
      renderItem={({ item }) => (
        <BinderGridTile
          binder={item}
          onPress={() => navigation.navigate('BinderDetail', { binderId: item.id, title: item.title })}
        />
      )}
    />

    <ReportUserModal visible={reportOpen} onClose={() => setReportOpen(false)} reportedUserId={owner.id} />
    </>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  searchField: {
    marginTop: spacing.lg,
    marginBottom: 0,
  },
  waIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.whatsapp,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followButton: {
    backgroundColor: colors.primary,
  },
  followingButton: {
    backgroundColor: colors.muted,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  reportButton: {
    backgroundColor: colors.muted,
  },
  });
}
