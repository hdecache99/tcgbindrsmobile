import { Fragment } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ColorAura from './binders/ColorAura';
import { fonts, radius, spacing } from '../theme';
import { useTheme } from '../lib/ThemeContext';

const BANNER_HEIGHT = 72;
const AVATAR_SIZE = 84;

// Mismo lenguaje visual que el perfil público de la web (/u/[username]):
// banner de color + aura ambiental + avatar en marco squircle superpuesto +
// badges + stats en pills. Se usa igual en ProfileScreen (perfil propio) y
// UserProfileScreen (perfil público) para que ambos se vean parecidos.
export default function ProfileHeader({ avatarUrl, displayName, username, bannerColor, stats }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const accent = bannerColor || '#581c87';
  const letter = (displayName || username || '?').charAt(0).toUpperCase();

  return (
    <View style={styles.card}>
      <View style={[styles.banner, { backgroundColor: accent }]}>
        <ColorAura color={accent} />
        <View style={styles.bannerShade} />
      </View>

      <View style={styles.body}>
        <View style={[styles.avatarRing, { backgroundColor: accent }]}>
          <View style={styles.avatarInner}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarLetter}>{letter}</Text>
            )}
          </View>
        </View>

        <View style={styles.nameRow}>
          <Text style={styles.displayName} numberOfLines={1}>
            {displayName || username}
          </Text>
          <View style={styles.verifiedBadge}>
            <Ionicons name="shield-checkmark" size={9} color={colors.primary} />
            <Text style={styles.verifiedBadgeText}>Verificado</Text>
          </View>
        </View>

        <View style={styles.usernamePill}>
          <Text style={styles.username}>@{username}</Text>
        </View>

        {stats?.length ? (
          <View style={styles.statsRow}>
            {stats.map((s, i) => (
              <Fragment key={s.label}>
                <View style={styles.stat}>
                  <Text style={styles.statNumber}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
                {i < stats.length - 1 ? <View style={styles.statDivider} /> : null}
              </Fragment>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
    card: {
      borderRadius: radius.xl,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    banner: {
      height: BANNER_HEIGHT,
      width: '100%',
      overflow: 'hidden',
    },
    bannerShade: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.15)',
    },
    body: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
    },
    avatarRing: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: 22,
      padding: 3,
      marginTop: -(AVATAR_SIZE / 2 + 4),
      marginBottom: spacing.sm,
    },
    avatarInner: {
      flex: 1,
      borderRadius: 19,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    avatarLetter: {
      fontFamily: fonts.extrabold,
      fontSize: 30,
      color: colors.primary,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 4,
    },
    displayName: {
      fontSize: 18,
      fontFamily: fonts.extrabold,
      color: colors.foreground,
      maxWidth: '60%',
    },
    verifiedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: radius.pill,
      backgroundColor: colors.muted,
    },
    verifiedBadgeText: {
      fontSize: 9,
      fontFamily: fonts.extrabold,
      color: colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    usernamePill: {
      alignSelf: 'flex-start',
      marginBottom: spacing.md,
    },
    username: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: colors.mutedForeground,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    stat: {
      alignItems: 'flex-start',
    },
    statNumber: {
      fontSize: 16,
      fontFamily: fonts.bold,
      color: colors.foreground,
    },
    statLabel: {
      fontSize: 10,
      fontFamily: fonts.medium,
      color: colors.mutedForeground,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    statDivider: {
      width: 1,
      height: 22,
      backgroundColor: colors.border,
    },
  });
}
