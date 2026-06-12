import { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { fetchDailyGoals, setDailyGoal, DailyGoalsResponse } from '../lib/stats-service';
import { TextInputModal } from './text-input-modal';

// Daily review goal with progress bar. Tap "edit" to change the target.
export function DailyGoalCard() {
  const [data, setData] = useState<DailyGoalsResponse | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const load = useCallback(() => {
    fetchDailyGoals().then(setData).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const reviewGoal = data?.goals.find((g) => g.goal_type === 'reviews_completed' && g.is_active);
  const done = data?.progress.reviews_completed ?? 0;
  const target = reviewGoal?.target_value ?? 0;
  const pct = target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0;

  const submitGoal = async (value: string) => {
    setEditorOpen(false);
    const newTarget = parseInt(value, 10);
    if (!newTarget || newTarget < 1 || newTarget > 500) {
      Alert.alert('Invalid goal', 'Pick a number between 1 and 500.');
      return;
    }
    try {
      await setDailyGoal('reviews_completed', newTarget);
      load();
    } catch {
      Alert.alert('Save failed', 'Try again');
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>🎯 Daily Goal</Text>
        <TouchableOpacity onPress={() => setEditorOpen(true)}>
          <Text style={styles.edit}>{reviewGoal ? 'Edit' : 'Set goal'}</Text>
        </TouchableOpacity>
      </View>

      {reviewGoal ? (
        <View>
          <Text style={styles.progressText}>
            {done} / {target} reviews today {pct >= 100 ? '· done! 🎉' : ''}
          </Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${pct}%` }]} />
          </View>
        </View>
      ) : (
        <Text style={styles.empty}>Set a daily review goal to build a streak.</Text>
      )}

      <TextInputModal
        visible={editorOpen}
        title="Daily review goal"
        message="How many words do you want to review per day?"
        placeholder="e.g. 20"
        initialValue={reviewGoal ? String(reviewGoal.target_value) : '20'}
        keyboardType="number-pad"
        onSubmit={submitGoal}
        onCancel={() => setEditorOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e293b', borderRadius: 14, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#334155',
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  label: { color: '#e2e8f0', fontSize: 14, fontWeight: '600' },
  edit: { color: '#a855f7', fontSize: 13, fontWeight: '600' },
  progressText: { color: '#94a3b8', fontSize: 13, marginBottom: 8 },
  track: { height: 8, backgroundColor: '#0f172a', borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#22c55e' },
  empty: { color: '#64748b', fontSize: 13 },
});
