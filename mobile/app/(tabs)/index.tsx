import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/lib/auth-context';
import { WordOfDayCard } from '../../src/components/word-of-day-card';
import { DailyGoalCard } from '../../src/components/daily-goal-card';
import { Screen, Card, Eyebrow, AppButton, Icon } from '../../src/theme/ui-primitives';
import { useTheme } from '../../src/theme/theme-context';
import { spacing, radius, typography, fonts, makeShadow } from '../../src/theme/theme';
import { AppHeader } from '../../src/components/app-header';
import { fetchStats } from '../../src/lib/stats-service';
import { fetchVocabulary, VocabularyItem } from '../../src/lib/vocabulary-service';

export default function HomeScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [streak, setStreak] = useState<number | null>(null);
  const [recentWords, setRecentWords] = useState<VocabularyItem[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchStats().then((s) => setStreak(s.currentStreak)).catch(() => {});
    fetchVocabulary('', 0).then((p) => setRecentWords(p.items.slice(0, 8))).catch(() => {});
  }, [user]);

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  })();

  return (
    <View style={{ flex: 1 }}>
      <AppHeader />
      <Screen scroll edgeToEdge contentStyle={{ paddingBottom: 120, gap: spacing.xl }}>

        {/* Greeting */}
        <View style={{ gap: spacing.xs }}>
          <Text style={[typography.headline, { color: colors.onSurface }]}>
            {greeting}{user?.displayName ? `, ${user.displayName}` : ''}.
          </Text>
          <Text style={[typography.body, { color: colors.onSurfaceVariant }]}>
            {user ? 'Ready to master your characters today?' : 'Snap a photo to start learning Chinese.'}
          </Text>
        </View>

        {/* Word of the Day */}
        {user && <WordOfDayCard />}

        {/* Daily Goal */}
        {user && <DailyGoalCard />}

        {/* Streak banner */}
        {user && streak !== null && streak > 0 && (
          <View style={[styles.streakBanner, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}>
            <MaterialIcons name="local-fire-department" size={20} color={colors.primary} />
            <Text style={[typography.label, { color: colors.primary, fontSize: 13, flex: 1 }]}>
              {streak}-Day Streak — Keep it up!
            </Text>
          </View>
        )}

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

        {/* Recent Discoveries */}
        {user && recentWords.length > 0 && (
          <View style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Eyebrow>Recent Discoveries</Eyebrow>
              <Pressable onPress={() => router.push('/(tabs)/vocabulary')}>
                <Text style={[typography.label, { color: colors.primary, fontSize: 12 }]}>View All</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
              {recentWords.map((word) => (
                <View key={word.id} style={[styles.wordChip, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
                  <Text style={{ fontFamily: fonts.hanzi, fontSize: 20, color: colors.onSurface }}>{word.wordZh}</Text>
                  <Text style={[typography.pinyin, { color: colors.outline, fontSize: 11, marginTop: 2 }]}>{word.wordEn}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Guest CTA */}
        {!user && (
          <Card>
            <Text style={[typography.body, { color: colors.onSurfaceVariant, textAlign: 'center', marginBottom: spacing.sm }]}>
              Log in to save words, track progress, and more.
            </Text>
            <AppButton label="Log in / Sign up" onPress={() => router.push('/(auth)/login')} />
          </Card>
        )}
      </Screen>
    </View>
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
  streakBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    borderRadius: radius.md, borderWidth: 1, paddingVertical: 12, paddingHorizontal: spacing.md,
  },
  wordChip: {
    alignItems: 'center', borderRadius: radius.md, borderWidth: 1,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, minWidth: 64,
  },
});
