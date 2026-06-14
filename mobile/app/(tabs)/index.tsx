import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/lib/auth-context';
import { WordOfDayCard } from '../../src/components/word-of-day-card';
import { Screen, Card, Eyebrow, AppButton, Icon } from '../../src/theme/ui-primitives';
import { useTheme } from '../../src/theme/theme-context';
import { spacing, radius, typography, fonts, makeShadow } from '../../src/theme/theme';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

interface QuickLink { route: string; icon: IconName; title: string; subtitle: string; guestOk: boolean }

const LINKS: QuickLink[] = [
  { route: '/(tabs)/vocabulary', icon: 'menu-book', title: 'Library', subtitle: 'Your saved words', guestOk: false },
  { route: '/lists', icon: 'folder', title: 'Lists', subtitle: 'Collections', guestOk: false },
  { route: '/history', icon: 'history', title: 'History', subtitle: 'Past analyses', guestOk: false },
  { route: '/stories', icon: 'auto-stories', title: 'Stories', subtitle: 'Photo stories', guestOk: false },
  { route: '/progress', icon: 'bar-chart', title: 'Progress', subtitle: 'Streaks & stats', guestOk: false },
  { route: '/courses', icon: 'school', title: 'Courses', subtitle: 'Community sets', guestOk: false },
  { route: '/import-vocabulary', icon: 'file-download', title: 'Import', subtitle: 'From text/URL', guestOk: false },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const links = LINKS.filter((l) => user || l.guestOk);

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  })();

  return (
    <Screen scroll contentStyle={{ paddingBottom: 120, gap: spacing.xl }}>
      {/* Greeting */}
      <View style={{ gap: spacing.base }}>
        <Eyebrow>AI 词典 · Modern Sinologist</Eyebrow>
        <Text style={[typography.headline, { color: colors.onSurface }]}>
          {greeting}{user?.displayName ? `, ${user.displayName}` : ''}.
        </Text>
        <Text style={[typography.body, { color: colors.onSurfaceVariant }]}>
          {user ? 'Ready to master your characters today?' : 'Snap a photo to start learning Chinese.'}
        </Text>
      </View>

      {user && <WordOfDayCard />}

      {/* Quick Learning */}
      <View style={{ gap: spacing.sm }}>
        <Eyebrow>Quick Learning</Eyebrow>
        <View style={{ flexDirection: 'row', gap: spacing.cardGutter }}>
          <Pressable
            style={({ pressed }) => [
              styles.quickPrimary,
              { backgroundColor: colors.primaryContainer, ...makeShadow(colors, 'jade') },
              pressed && { transform: [{ scale: 0.98 }] },
            ]}
            onPress={() => router.push('/(tabs)/capture')}
          >
            <MaterialIcons name="photo-camera" size={30} color={colors.onPrimaryContainer} />
            <Text style={[typography.label, { color: colors.onPrimaryContainer, fontSize: 13 }]}>Capture & Learn</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.quickSecondary,
              { backgroundColor: colors.surface, borderColor: colors.outlineVariant, ...makeShadow(colors, 'card') },
              pressed && { transform: [{ scale: 0.98 }] },
            ]}
            onPress={() => router.push(user ? '/practice-flashcards' : '/(auth)/login')}
          >
            <MaterialIcons name="history-edu" size={30} color={colors.onSurfaceVariant} />
            <Text style={[typography.label, { color: colors.onSurfaceVariant, fontSize: 13 }]}>Daily Review</Text>
          </Pressable>
        </View>
      </View>

      {/* Explore grid */}
      {links.length > 0 && (
        <View style={{ gap: spacing.sm }}>
          <Eyebrow>Explore</Eyebrow>
          <View style={styles.grid}>
            {links.map((link) => (
              <Card key={link.route} onPress={() => router.push(link.route as never)} style={styles.tile}>
                <View style={[styles.tileIcon, { backgroundColor: colors.primarySoft }]}>
                  <Icon name={link.icon} size={22} color={colors.primary} />
                </View>
                <Text style={[typography.heading, { fontSize: 15, color: colors.onSurface, marginTop: spacing.sm }]}>
                  {link.title}
                </Text>
                <Text style={[typography.pinyin, { color: colors.outline }]}>{link.subtitle}</Text>
              </Card>
            ))}
          </View>
        </View>
      )}

      {!user && (
        <Card>
          <Text style={[typography.body, { color: colors.onSurfaceVariant, textAlign: 'center', marginBottom: spacing.sm }]}>
            Log in to save words, track progress, and more.
          </Text>
          <AppButton label="Log in / Sign up" onPress={() => router.push('/(auth)/login')} />
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  quickPrimary: {
    flex: 1, borderRadius: radius.lg, paddingVertical: spacing.lg,
    alignItems: 'center', gap: spacing.xs,
  },
  quickSecondary: {
    flex: 1, borderRadius: radius.lg, paddingVertical: spacing.lg,
    alignItems: 'center', gap: spacing.xs, borderWidth: 1,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.cardGutter },
  tile: { width: '47%', flexGrow: 1 },
  tileIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
