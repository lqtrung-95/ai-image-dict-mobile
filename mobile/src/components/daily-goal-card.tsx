import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, Animated, ActivityIndicator } from 'react-native';
import { fetchDailyGoals, setDailyGoal, DailyGoalsResponse } from '../lib/stats-service';
import { TextInputModal } from './text-input-modal';
import { useTheme } from '../theme/theme-context';
import { spacing, radius, typography } from '../theme/theme';
import { Icon } from '../theme/ui-primitives';
import { useLocale } from '../lib/locale-react-context';

function SkeletonBar({ width }: { width: number | string }) {
  const { colors } = useTheme();
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
    return () => anim.stopAnimation();
  }, [anim]);
  return <Animated.View style={{ width, height: 12, borderRadius: 6, backgroundColor: colors.surfaceContainer, opacity: anim }} />;
}

// Daily review goal with progress bar. Tap "edit" to change the target.
export function DailyGoalCard() {
  const { colors } = useTheme();
  const { t } = useLocale();
  const [data, setData] = useState<DailyGoalsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

  const load = useCallback(() => {
    fetchDailyGoals().then(setData).catch(() => {}).finally(() => setLoading(false));
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
      Alert.alert(t('dailyGoal.title'), t('dailyGoal.invalidGoal'));
      return;
    }
    setSaving(true);
    try {
      await setDailyGoal('reviews_completed', newTarget);
      load();
    } catch {
      Alert.alert(t('dailyGoal.title'), t('dailyGoal.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="track-changes" size={18} color={colors.primary} />
          <Text style={[typography.heading, { fontSize: 15, color: colors.onSurface }]}>{t('dailyGoal.title')}</Text>
        </View>
        {saving ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Pressable onPress={() => setEditorOpen(true)} disabled={loading}>
            <Text style={[typography.label, { fontSize: 13, color: colors.primary }]}>{reviewGoal ? t('dailyGoal.edit') : t('dailyGoal.setGoal')}</Text>
          </Pressable>
        )}
      </View>

      {loading ? (
        <View style={{ gap: 8 }}>
          <SkeletonBar width="60%" />
          <View style={[styles.track, { backgroundColor: colors.background }]}>
            <Animated.View style={[styles.fill, { width: '40%', backgroundColor: colors.surfaceContainer }]} />
          </View>
        </View>
      ) : reviewGoal ? (
        <View>
          <Text style={[typography.pinyin, { color: colors.onSurfaceVariant, marginBottom: spacing.xs }]}>
            {pct >= 100 ? t('dailyGoal.progressDone', { done, target }) : t('dailyGoal.progress', { done, target })}
          </Text>
          <View style={[styles.track, { backgroundColor: colors.background }]}>
            <View style={[styles.fill, { width: `${pct}%`, backgroundColor: colors.primary }]} />
          </View>
        </View>
      ) : (
        <Text style={[typography.pinyin, { color: colors.outline }]}>{t('dailyGoal.noGoal')}</Text>
      )}

      <TextInputModal
        visible={editorOpen}
        title={t('dailyGoal.title')}
        message={t('dailyGoal.setGoalMessage')}
        placeholder={t('dailyGoal.setGoalPlaceholder')}
        submitLabel={t('dailyGoal.setGoal')}
        cancelLabel={t('common.cancel')}
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
