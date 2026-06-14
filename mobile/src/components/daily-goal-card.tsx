import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { fetchDailyGoals, setDailyGoal, DailyGoalsResponse } from '../lib/stats-service';
import { TextInputModal } from './text-input-modal';
import { useTheme } from '../theme/theme-context';
import { spacing, radius, typography } from '../theme/theme';
import { Icon } from '../theme/ui-primitives';

// Daily review goal with progress bar. Tap "edit" to change the target.
export function DailyGoalCard() {
  const { colors } = useTheme();
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
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="track-changes" size={18} color={colors.primary} />
          <Text style={[typography.heading, { fontSize: 15, color: colors.onSurface }]}>Daily Goal</Text>
        </View>
        <Pressable onPress={() => setEditorOpen(true)}>
          <Text style={[typography.label, { fontSize: 13, color: colors.primary }]}>{reviewGoal ? 'Edit' : 'Set goal'}</Text>
        </Pressable>
      </View>

      {reviewGoal ? (
        <View>
          <Text style={[typography.pinyin, { color: colors.onSurfaceVariant, marginBottom: spacing.xs }]}>
            {done} / {target} reviews today {pct >= 100 ? '· done!' : ''}
          </Text>
          <View style={[styles.track, { backgroundColor: colors.background }]}>
            <View style={[styles.fill, { width: `${pct}%`, backgroundColor: colors.primary }]} />
          </View>
        </View>
      ) : (
        <Text style={[typography.pinyin, { color: colors.outline }]}>Set a daily review goal to build a streak.</Text>
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
  card: { borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%' },
});
