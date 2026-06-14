import { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Pressable, RefreshControl } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchStats, fetchWordsByState, UserStats, WordsByState } from '../src/lib/stats-service';
import { DailyGoalCard } from '../src/components/daily-goal-card';
import { StatsBarChart } from '../src/components/stats-bar-chart';
import { useTheme } from '../src/theme/theme-context';
import { spacing, radius, typography, hskColors, makeShadow } from '../src/theme/theme';
import { Eyebrow, Icon } from '../src/theme/ui-primitives';

const HSK_LABELS: Record<string, string> = {
  hsk1: 'HSK 1', hsk2: 'HSK 2', hsk3: 'HSK 3', hsk4: 'HSK 4', hsk5: 'HSK 5', hsk6: 'HSK 6', unclassified: 'Other',
};
const STATE_META: { key: keyof WordsByState; label: string; color: string }[] = [
  { key: 'new', label: 'New', color: '#89938b' },
  { key: 'learning', label: 'Learning', color: '#d9a14a' },
  { key: 'reviewing', label: 'Reviewing', color: '#3b82f6' },
  { key: 'mastered', label: 'Mastered', color: '#2d6a4f' },
];

export default function ProgressScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [wordsByState, setWordsByState] = useState<WordsByState | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, ws] = await Promise.all([fetchStats(), fetchWordsByState()]);
      setStats(s); setWordsByState(ws);
    } catch { /* keep previous */ }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!stats) {
    return <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  const masteryPct = stats.totalWords > 0 ? Math.round((stats.learnedWords / stats.totalWords) * 100) : 0;
  const totalHsk = Object.values(stats.hskDistribution ?? {}).reduce((a, b) => a + b, 0);
  const totalStates = wordsByState ? STATE_META.reduce((sum, s) => sum + (wordsByState[s.key] ?? 0), 0) : 0;

  const tiles = [
    { icon: 'local-fire-department' as const, value: stats.currentStreak, label: `Day streak · best ${stats.longestStreak}` },
    { icon: 'menu-book' as const, value: stats.totalWords, label: 'Total words' },
    { icon: 'school' as const, value: stats.learnedWords, label: `Mastered${stats.masteredThisWeek > 0 ? ` · +${stats.masteredThisWeek}/wk` : ''}` },
    { icon: 'fitness-center' as const, value: stats.totalPracticeSessions, label: 'Practice sessions' },
  ];

  const sectionStyle = [styles.section, { backgroundColor: colors.surface, ...makeShadow(colors, 'card') }];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.containerMargin, paddingTop: insets.top + spacing.sm, paddingBottom: 120 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.primary} />}
    >
      <Text style={[typography.headline, { color: colors.onSurface, marginBottom: spacing.md }]}>Progress</Text>

      {stats.dueToday > 0 && (
        <Pressable style={[styles.dueCard, { backgroundColor: colors.primarySoft, borderColor: colors.primaryFixed }]} onPress={() => router.push('/practice-flashcards')}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
            <Icon name="schedule" size={22} color={colors.primary} />
            <Text style={[typography.heading, { fontSize: 15, color: colors.onSurface }]}>{stats.dueToday} words due for review</Text>
          </View>
          <Icon name="chevron-right" size={22} color={colors.primary} />
        </Pressable>
      )}

      <DailyGoalCard />

      <View style={styles.grid}>
        {tiles.map((t) => (
          <View key={t.label} style={[styles.tile, { backgroundColor: colors.surface, ...makeShadow(colors, 'card') }]}>
            <Icon name={t.icon} size={20} color={colors.primary} />
            <Text style={{ ...typography.headlineLg, color: colors.onSurface, marginTop: spacing.xs }}>{t.value}</Text>
            <Text style={[typography.label, { fontSize: 11, color: colors.outline }]}>{t.label}</Text>
          </View>
        ))}
      </View>

      <View style={sectionStyle}>
        <View style={styles.sectionHead}>
          <Eyebrow>Mastery</Eyebrow>
          <Text style={[typography.heading, { color: colors.primary }]}>{masteryPct}%</Text>
        </View>
        <View style={[styles.track, { backgroundColor: colors.background }]}>
          <View style={{ height: '100%', width: `${masteryPct}%`, backgroundColor: colors.primary }} />
        </View>
      </View>

      {wordsByState && totalStates > 0 && (
        <View style={sectionStyle}>
          <Eyebrow>Word States</Eyebrow>
          <View style={styles.stateBar}>
            {STATE_META.map(({ key, color }) => {
              const w = (wordsByState[key] / totalStates) * 100;
              return w > 0 ? <View key={key} style={{ width: `${w}%`, backgroundColor: color }} /> : null;
            })}
          </View>
          <View style={styles.legend}>
            {STATE_META.map(({ key, label, color }) => (
              <View key={key} style={styles.legendItem}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
                <Text style={[typography.label, { fontSize: 11, color: colors.onSurfaceVariant }]}>{label} {wordsByState[key]}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {totalHsk > 0 && (
        <View style={sectionStyle}>
          <Eyebrow style={{ marginBottom: spacing.sm }}>HSK Levels</Eyebrow>
          {Object.entries(stats.hskDistribution).map(([level, count]) => {
            if (!count) return null;
            const pct = Math.round((count / totalHsk) * 100);
            return (
              <View key={level} style={{ marginBottom: spacing.sm }}>
                <View style={styles.sectionHead}>
                  <Text style={[typography.label, { fontSize: 12, color: colors.onSurfaceVariant }]}>{HSK_LABELS[level] ?? level}</Text>
                  <Text style={[typography.label, { fontSize: 12, color: colors.outline }]}>{count} ({pct}%)</Text>
                </View>
                <View style={[styles.track, { backgroundColor: colors.background }]}>
                  <View style={{ height: '100%', width: `${pct}%`, backgroundColor: hskColors[level] ?? colors.primary }} />
                </View>
              </View>
            );
          })}
        </View>
      )}

      {stats.reviewForecast?.length > 0 && (
        <View style={sectionStyle}>
          <Eyebrow style={{ marginBottom: spacing.md }}>Review Forecast (7 days)</Eyebrow>
          <StatsBarChart data={stats.reviewForecast} />
        </View>
      )}

      {stats.wordsPerDay?.length > 0 && (
        <View style={sectionStyle}>
          <Eyebrow style={{ marginBottom: spacing.md }}>Words Added (7 days)</Eyebrow>
          <StatsBarChart data={stats.wordsPerDay} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  dueCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  tile: { width: '47%', flexGrow: 1, borderRadius: radius.lg, padding: spacing.md },
  section: { borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  stateBar: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', marginTop: spacing.sm, marginBottom: spacing.sm },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
});
