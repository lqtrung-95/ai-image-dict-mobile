import { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { fetchStats, fetchWordsByState, UserStats, WordsByState } from '../src/lib/stats-service';
import { DailyGoalCard } from '../src/components/daily-goal-card';
import { StatsBarChart } from '../src/components/stats-bar-chart';

const HSK_LABELS: Record<string, string> = {
  hsk1: 'HSK 1', hsk2: 'HSK 2', hsk3: 'HSK 3',
  hsk4: 'HSK 4', hsk5: 'HSK 5', hsk6: 'HSK 6', unclassified: 'Other',
};
const HSK_COLORS: Record<string, string> = {
  hsk1: '#22c55e', hsk2: '#10b981', hsk3: '#eab308',
  hsk4: '#f97316', hsk5: '#ef4444', hsk6: '#a855f7', unclassified: '#64748b',
};
const STATE_META: { key: keyof WordsByState; label: string; color: string }[] = [
  { key: 'new', label: 'New', color: '#64748b' },
  { key: 'learning', label: 'Learning', color: '#eab308' },
  { key: 'reviewing', label: 'Reviewing', color: '#3b82f6' },
  { key: 'mastered', label: 'Mastered', color: '#22c55e' },
];

export default function ProgressScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [wordsByState, setWordsByState] = useState<WordsByState | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, ws] = await Promise.all([fetchStats(), fetchWordsByState()]);
      setStats(s);
      setWordsByState(ws);
    } catch {
      // keep previous data on transient error
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!stats) {
    return <View style={[styles.container, styles.centered]}><ActivityIndicator size="large" color="#a855f7" /></View>;
  }

  const masteryPct = stats.totalWords > 0
    ? Math.round((stats.learnedWords / stats.totalWords) * 100)
    : 0;
  const totalHsk = Object.values(stats.hskDistribution ?? {}).reduce((a, b) => a + b, 0);
  const totalStates = wordsByState
    ? STATE_META.reduce((sum, s) => sum + (wordsByState[s.key] ?? 0), 0)
    : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
          tintColor="#a855f7"
        />
      }
    >
      {/* Due today CTA */}
      {stats.dueToday > 0 && (
        <TouchableOpacity style={styles.dueCard} onPress={() => router.push('/practice-flashcards')}>
          <Text style={styles.dueTitle}>⏰ {stats.dueToday} words due for review</Text>
          <Text style={styles.dueAction}>Practice now ›</Text>
        </TouchableOpacity>
      )}

      <DailyGoalCard />

      {/* Stat tiles */}
      <View style={styles.grid}>
        <View style={[styles.tile, { borderColor: '#f9731655' }]}>
          <Text style={styles.tileEmoji}>🔥</Text>
          <Text style={[styles.tileValue, { color: '#fb923c' }]}>{stats.currentStreak}</Text>
          <Text style={styles.tileLabel}>Day streak · best {stats.longestStreak}</Text>
        </View>
        <View style={[styles.tile, { borderColor: '#3b82f655' }]}>
          <Text style={styles.tileEmoji}>📚</Text>
          <Text style={[styles.tileValue, { color: '#60a5fa' }]}>{stats.totalWords}</Text>
          <Text style={styles.tileLabel}>Total words</Text>
        </View>
        <View style={[styles.tile, { borderColor: '#22c55e55' }]}>
          <Text style={styles.tileEmoji}>🎓</Text>
          <Text style={[styles.tileValue, { color: '#4ade80' }]}>{stats.learnedWords}</Text>
          <Text style={styles.tileLabel}>
            Mastered{stats.masteredThisWeek > 0 ? ` · +${stats.masteredThisWeek} this week` : ''}
          </Text>
        </View>
        <View style={[styles.tile, { borderColor: '#a855f755' }]}>
          <Text style={styles.tileEmoji}>🎯</Text>
          <Text style={[styles.tileValue, { color: '#c084fc' }]}>{stats.totalPracticeSessions}</Text>
          <Text style={styles.tileLabel}>Practice sessions</Text>
        </View>
      </View>

      {/* Mastery bar */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mastery</Text>
          <Text style={styles.sectionValue}>{masteryPct}%</Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${masteryPct}%` }]} />
        </View>
      </View>

      {/* Word states */}
      {wordsByState && totalStates > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Word States</Text>
          <View style={styles.stateBar}>
            {STATE_META.map(({ key, color }) => {
              const widthPct = (wordsByState[key] / totalStates) * 100;
              if (widthPct === 0) return null;
              return <View key={key} style={{ width: `${widthPct}%`, backgroundColor: color }} />;
            })}
          </View>
          <View style={styles.legend}>
            {STATE_META.map(({ key, label, color }) => (
              <View key={key} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: color }]} />
                <Text style={styles.legendText}>{label} {wordsByState[key]}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* HSK distribution */}
      {totalHsk > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>HSK Levels</Text>
          {Object.entries(stats.hskDistribution).map(([level, count]) => {
            if (!count) return null;
            const pct = Math.round((count / totalHsk) * 100);
            return (
              <View key={level} style={{ marginBottom: 8 }}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.legendText}>{HSK_LABELS[level] ?? level}</Text>
                  <Text style={styles.legendText}>{count} ({pct}%)</Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${pct}%`, backgroundColor: HSK_COLORS[level] }]} />
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Review forecast */}
      {stats.reviewForecast?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Review Forecast (7 days)</Text>
          <StatsBarChart data={stats.reviewForecast} accentColor="#06b6d4" />
        </View>
      )}

      {/* Words added */}
      {stats.wordsPerDay?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Words Added (7 days)</Text>
          <StatsBarChart data={stats.wordsPerDay} accentColor="#a855f7" />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  dueCard: {
    backgroundColor: '#9333ea22', borderColor: '#9333ea55', borderWidth: 1,
    borderRadius: 14, padding: 16, marginBottom: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  dueTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  dueAction: { color: '#c4b5fd', fontSize: 14, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  tile: {
    width: '48%', backgroundColor: '#1e293b', borderRadius: 14, padding: 14, borderWidth: 1,
    flexGrow: 1,
  },
  tileEmoji: { fontSize: 18, marginBottom: 4 },
  tileValue: { fontSize: 26, fontWeight: 'bold' },
  tileLabel: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  section: {
    backgroundColor: '#1e293b', borderRadius: 14, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#334155',
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  sectionTitle: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 10 },
  sectionValue: { color: '#c084fc', fontSize: 15, fontWeight: '700' },
  track: { height: 8, backgroundColor: '#0f172a', borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#a855f7' },
  stateBar: {
    flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 10,
  },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: '#94a3b8', fontSize: 12 },
});
