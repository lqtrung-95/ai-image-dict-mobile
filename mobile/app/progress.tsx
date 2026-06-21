import { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { fetchStats, fetchWordsByState, UserStats, WordsByState } from '../src/lib/stats-service';
import { StatsBarChart } from '../src/components/stats-bar-chart';
import { AppHeader } from '../src/components/app-header';
import { useTheme } from '../src/theme/theme-context';
import { useLocale } from '../src/lib/locale-react-context';
import { spacing, radius, typography, hskColors, makeShadow } from '../src/theme/theme';
import { Eyebrow, Icon } from '../src/theme/ui-primitives';
import { MaterialIcons } from '@expo/vector-icons';

const HSK_LABELS: Record<string, string> = {
  hsk1: 'HSK 1', hsk2: 'HSK 2', hsk3: 'HSK 3',
  hsk4: 'HSK 4', hsk5: 'HSK 5', hsk6: 'HSK 6', unclassified: 'Other',
};

// Official cumulative HSK vocabulary counts per level
const HSK_TOTAL: Record<string, number> = {
  hsk1: 150, hsk2: 300, hsk3: 600, hsk4: 1200, hsk5: 2500, hsk6: 5000,
};

// Build a 13×7 heatmap grid from wordsPerDay data
function buildHeatmap(wordsPerDay: { date: string; count: number }[]) {
  const map = new Map(wordsPerDay.map((d) => [d.date, d.count]));
  const today = new Date();
  const cells: { date: string; count: number }[] = [];
  for (let i = 90; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    cells.push({ date: key, count: map.get(key) ?? 0 });
  }
  // Group into weeks (columns)
  const weeks: { date: string; count: number }[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

function HeatmapCell({ count }: { count: number }) {
  const { colors } = useTheme();
  const opacity = count === 0 ? 0 : count < 3 ? 0.3 : count < 6 ? 0.6 : 1;
  return (
    <View
      style={[
        styles.heatCell,
        { backgroundColor: count === 0 ? colors.surfaceContainer : colors.primary, opacity: count === 0 ? 1 : opacity },
      ]}
    />
  );
}

interface Achievement {
  icon: string;
  title: string;
  desc: string;
  earned: boolean;
}

export default function ProgressScreen() {
  const { colors } = useTheme();
  const { t } = useLocale();
  const router = useRouter();
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

  const sectionStyle = [styles.section, { backgroundColor: colors.surface, ...makeShadow(colors, 'card') }];

  if (!stats) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppHeader />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  const mastered = wordsByState?.mastered ?? stats.learnedWords;
  const learning = (wordsByState?.learning ?? 0) + (wordsByState?.reviewing ?? 0);
  const totalHsk = Object.values(stats.hskDistribution ?? {}).reduce((a, b) => a + b, 0);
  const heatmapWeeks = buildHeatmap(stats.wordsPerDay ?? []);
  const achievements: Achievement[] = [
    { icon: '🖊️', title: t('progressScreen.achievementFirstWordTitle'), desc: t('progressScreen.achievementFirstWordDesc'), earned: stats.totalWords >= 1 },
    { icon: '🔥', title: t('progressScreen.achievementStreakTitle'), desc: t('progressScreen.achievementStreakDesc'), earned: stats.currentStreak >= 3 },
    { icon: '📚', title: t('progressScreen.achievementScholarTitle'), desc: t('progressScreen.achievementScholarDesc'), earned: stats.totalWords >= 10 },
    { icon: '⭐', title: t('progressScreen.achievementSageTitle'), desc: t('progressScreen.achievementSageDesc'), earned: mastered >= 5 },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
            tintColor={colors.primary}
          />
        }
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg, gap: spacing.md }}>
          <Text style={[typography.headlineLg, { color: colors.onSurface, flex: 1 }]}>{t('progressScreen.masteryOverview')}</Text>
          <Pressable
            style={[styles.leaderboardBtn, { backgroundColor: colors.primarySoft }]}
            onPress={() => router.push('/leaderboard' as never)}
          >
            <Text style={{ fontSize: 14 }}>🏆</Text>
            <Text style={[typography.label, { fontSize: 12, color: colors.primary }]}>{t('progressScreen.rankings')}</Text>
          </Pressable>
        </View>

        {/* Stat chips row */}
        <View style={styles.chipRow}>
          <View style={[styles.chip, { backgroundColor: colors.surface, ...makeShadow(colors, 'card') }]}>
            <Icon name="school" size={18} color={colors.primary} />
            <Text style={[typography.headlineLg, { color: colors.onSurface }]}>{mastered}</Text>
            <Text style={[typography.label, { fontSize: 11, color: colors.outline }]}>{t('progressScreen.mastered')}</Text>
          </View>
          <View style={[styles.chip, { backgroundColor: colors.surface, ...makeShadow(colors, 'card') }]}>
            <Icon name="menu-book" size={18} color={colors.primary} />
            <Text style={[typography.headlineLg, { color: colors.onSurface }]}>{learning}</Text>
            <Text style={[typography.label, { fontSize: 11, color: colors.outline }]}>{t('progressScreen.learning')}</Text>
          </View>
          <View style={[styles.chip, { backgroundColor: colors.surface, ...makeShadow(colors, 'card') }]}>
            <MaterialIcons name="local-fire-department" size={18} color={colors.primary} />
            <Text style={[typography.headlineLg, { color: colors.onSurface }]}>{stats.currentStreak}</Text>
            <Text style={[typography.label, { fontSize: 11, color: colors.outline }]}>{t('progressScreen.dayStreak')}</Text>
          </View>
        </View>

        {/* Study Consistency heatmap */}
        <View style={sectionStyle}>
          <Eyebrow style={{ marginBottom: spacing.xs }}>{t('progressScreen.studyConsistency')}</Eyebrow>
          <Text style={[typography.label, { fontSize: 11, color: colors.outline, marginBottom: spacing.sm }]}>
            {t('progressScreen.studyConsistencySub')}
          </Text>
          <View style={styles.heatmapGrid}>
            {heatmapWeeks.map((week, wi) => (
              <View key={wi} style={styles.heatmapCol}>
                {week.map((cell, di) => (
                  <HeatmapCell key={di} count={cell.count} />
                ))}
              </View>
            ))}
          </View>
          {stats.currentStreak > 0 && (
            <View style={[styles.streakBadge, { backgroundColor: colors.primaryContainer }]}>
              <MaterialIcons name="local-fire-department" size={14} color={colors.onPrimaryContainer} />
              <Text style={[typography.label, { fontSize: 11, color: colors.onPrimaryContainer }]}>
                {stats.currentStreak} {t('progressScreen.dayStreak')}
              </Text>
            </View>
          )}
        </View>

        {/* HSK Level Distribution */}
        {totalHsk > 0 && (
          <View style={sectionStyle}>
            <Eyebrow style={{ marginBottom: spacing.sm }}>{t('progressScreen.hskDistribution')}</Eyebrow>
            {Object.entries(stats.hskDistribution).map(([level, count]) => {
              if (!count) return null;
              const pct = Math.round((count / totalHsk) * 100);
              return (
                <View key={level} style={{ marginBottom: spacing.sm }}>
                  <View style={styles.barRow}>
                    <Text style={[typography.label, { fontSize: 12, color: colors.onSurfaceVariant }]}>
                      {HSK_LABELS[level] ?? level}
                    </Text>
                    <Text style={[typography.label, { fontSize: 12, color: colors.outline }]}>
                      {count}
                    </Text>
                  </View>
                  <View style={[styles.track, { backgroundColor: colors.surfaceContainer }]}>
                    <View style={{ height: '100%', width: `${pct}%`, backgroundColor: hskColors[level] ?? colors.primary, borderRadius: 4 }} />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* HSK Progress Dashboard */}
        <View style={sectionStyle}>
          <Eyebrow style={{ marginBottom: spacing.xs }}>{t('progressScreen.hskProgress')}</Eyebrow>
          <Text style={[typography.label, { fontSize: 11, color: colors.outline, marginBottom: spacing.md }]}>
            {t('progressScreen.hskProgressSub')}
          </Text>
          {(['hsk1', 'hsk2', 'hsk3', 'hsk4', 'hsk5', 'hsk6'] as const).map((level) => {
            const captured = stats.hskDistribution[level] ?? 0;
            const total = HSK_TOTAL[level];
            const pct = Math.min(Math.round((captured / total) * 100), 100);
            return (
              <View key={level} style={{ marginBottom: spacing.md }}>
                <View style={styles.barRow}>
                  <Text style={[typography.label, { fontSize: 13, color: colors.onSurface }]}>
                    {HSK_LABELS[level]}
                  </Text>
                  <Text style={[typography.label, { fontSize: 12, color: pct >= 100 ? colors.primary : colors.outline }]}>
                    {captured} / {total}  {pct >= 100 ? '✓' : `${pct}%`}
                  </Text>
                </View>
                <View style={[styles.track, { backgroundColor: colors.surfaceContainer }]}>
                  <View style={{ height: '100%', width: `${pct}%`, backgroundColor: hskColors[level] ?? colors.primary, borderRadius: 4 }} />
                </View>
              </View>
            );
          })}
        </View>

        {/* Review Forecast */}
        {stats.reviewForecast?.length > 0 && (
          <View style={sectionStyle}>
            <Eyebrow style={{ marginBottom: spacing.md }}>{t('progressScreen.reviewForecast')}</Eyebrow>
            <StatsBarChart data={stats.reviewForecast} />
          </View>
        )}

        {/* Achievements */}
        <View style={sectionStyle}>
          <Eyebrow style={{ marginBottom: spacing.sm }}>{t('progressScreen.achievementsTitle')}</Eyebrow>
          <View style={styles.achievementsGrid}>
            {achievements.map((a) => (
              <View
                key={a.title}
                style={[
                  styles.achievementBadge,
                  { backgroundColor: a.earned ? colors.primaryContainer : colors.surfaceContainer, opacity: a.earned ? 1 : 0.5 },
                ]}
              >
                <Text style={{ fontSize: 22 }}>{a.icon}</Text>
                <Text style={[typography.label, { fontSize: 11, color: a.earned ? colors.onPrimaryContainer : colors.onSurfaceVariant, textAlign: 'center' }]}>
                  {a.title}
                </Text>
                <Text style={[typography.label, { fontSize: 10, color: a.earned ? colors.onPrimaryContainer : colors.outline, textAlign: 'center' }]}>
                  {a.desc}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.containerMargin, paddingBottom: 120 },
  chipRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  leaderboardBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 7 },
  chip: {
    flex: 1, borderRadius: radius.lg, padding: spacing.sm,
    alignItems: 'center', gap: 3,
  },
  section: { borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  heatmapGrid: { flexDirection: 'row', gap: 2 },
  heatmapCol: { flex: 1, flexDirection: 'column', gap: 2 },
  heatCell: { height: 12, borderRadius: 2 },
  streakBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  barRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  achievementsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  achievementBadge: {
    width: '47%', borderRadius: radius.lg, padding: spacing.sm,
    alignItems: 'center', gap: 4,
  },
});
