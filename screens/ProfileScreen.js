import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, FlatList, Share, StyleSheet, View } from 'react-native';
import { getProfile } from '../lib/profile';
import { getUserBinders } from '../lib/binders';
import BinderGridTile from '../components/binders/BinderGridTile';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import AppHeader from '../components/AppHeader';
import ProfileHeader from '../components/ProfileHeader';
import AdBanner from '../components/AdBanner';
import { spacing } from '../theme';
import { useTheme } from '../lib/ThemeContext';

export default function ProfileScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [profile, setProfile] = useState(null);
  const [binders, setBinders] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      Promise.all([getProfile(), getUserBinders()]).then(([profileData, bindersData]) => {
        if (!active) return;
        setProfile(profileData);
        setBinders(bindersData);
        setLoading(false);
      });
      return () => {
        active = false;
      };
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader navigation={navigation} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  const totalCards = binders.reduce((sum, b) => sum + b.card_count, 0);

  async function handleShare() {
    const url = `https://www.tcgbindrs.com/u/${profile.username}`;
    try {
      await Share.share({
        message: `¡Mira mi colección en TCGBINDRS! @${profile.username}\n${url}`,
        url,
      });
    } catch {
      // el usuario cerró la hoja de compartir sin elegir nada — no hace falta manejarlo
    }
  }

  return (
    <View style={styles.container}>
      <AppHeader navigation={navigation} />
      <FlatList
        style={styles.flex}
        data={binders}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <ProfileHeader
              avatarUrl={profile.avatar_url}
              displayName={profile.display_name}
              username={profile.username}
              bannerColor={profile.banner_color}
              stats={[
                { value: binders.length, label: 'Binders' },
                { value: totalCards, label: 'Cartas' },
              ]}
            />

            <View style={styles.actionsRow}>
              <Button
                title="Editar perfil"
                variant="secondary"
                onPress={() => navigation.navigate('EditProfile')}
                style={styles.actionButton}
              />
              <Button
                title="Compartir"
                icon="share-social-outline"
                variant="secondary"
                onPress={handleShare}
                style={styles.actionButton}
              />
            </View>
          </View>
        }
        ListEmptyComponent={<EmptyState message="Todavía no tienes binders." />}
        renderItem={({ item }) => (
          <BinderGridTile
            binder={item}
            onPress={() =>
              navigation.navigate('Binders', { screen: 'BinderDetail', params: { binderId: item.id, title: item.title } })
            }
          />
        )}
      />

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
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  });
}
