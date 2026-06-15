import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { speakChinese } from '../src/lib/tts-speech-service';
import {
  fetchCourseDetail, subscribeToCourse, unsubscribeFromCourse, rateCourse,
  CourseDetail, CourseWord, CourseWordState,
} from '../src/lib/courses-service';
import { AppHeader } from '../src/components/app-header';
import { CourseProgressRing } from '../src/components/course-progress-ring';
import { SaveToListSheet } from '../src/components/save-to-list-sheet';
import { saveWordToVocabulary, DetectedWord } from '../src/lib/analysis-service';
import { fetchLists, VocabularyList } from '../src/lib/library-service';
import { showError } from '../src/lib/toast';
import { useTheme } from '../src/theme/theme-context';
import { spacing, radius, typography, fonts } from '../src/theme/theme';
import { Icon } from '../src/theme/ui-primitives';

type WordFilter = 'all' | CourseWordState;

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const [detail, setDetail] = useState<CourseDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<WordFilter>('all');
  const [lists, setLists] = useState<VocabularyList[]>([]);
  const [pickerWord, setPickerWord] = useState<CourseWord | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(() => {
    fetchCourseDetail(id)
      .then(setDetail)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Preload lists so the save sheet opens instantly when a word is bookmarked.
  useEffect(() => { fetchLists().then(setLists).catch(() => {}); }, []);

  // Persist a course word into a chosen list. Saving is idempotent server-side,
  // so a word already in the deck just gets added to the list (or no-ops).
  const handleChooseList = async (listId: string | null) => {
    const word = pickerWord;
    setPickerWord(null);
    if (!word) return;
    setSavingId(word.id);
    const detected: DetectedWord = {
      id: word.id, zh: word.word_zh, pinyin: word.word_pinyin, en: word.word_en,
      category: 'object', hskLevel: word.hsk_level ?? undefined,
    };
    try {
      await saveWordToVocabulary(detected, listId ?? undefined);
      setSavedIds((prev) => new Set(prev).add(word.id));
    } catch (err) {
      showError('Save failed', err instanceof Error ? err.message : 'Try again');
    } finally {
      setSavingId(null);
    }
  };

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppHeader title="Course" showBack />
        <View style={styles.centered}><Text style={[typography.body, { color: colors.error }]}>{error}</Text></View>
      </View>
    );
  }
  if (!detail) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppHeader title="Course" showBack />
        <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>
      </View>
    );
  }

  const { course, words, progress } = detail;
  const subscribed = detail.isSubscribed ?? course.isSubscribed ?? false;
  const myRating = detail.userRating?.rating ?? 0;
  const learned = progress?.learned ?? 0;
  const learning = progress?.learning ?? 0;
  const due = progress?.due ?? 0;
  const total = progress?.total ?? words.length;
  const newCount = total - learned - learning;
  const pct = total > 0 ? Math.round((learned / total) * 100) : 0;

  const toggleSubscribe = async () => {
    setBusy(true);
    try {
      if (subscribed) await unsubscribeFromCourse(id);
      else await subscribeToCourse(id);
      load();
    } catch (err) {
      showError('Action failed', err instanceof Error ? err.message : 'Try again');
    } finally {
      setBusy(false);
    }
  };

  const handleRate = async (stars: number) => {
    try {
      await rateCourse(id, stars);
      load();
    } catch (err) {
      showError('Rating failed', err instanceof Error ? err.message : 'Try again');
    }
  };

  const startStudy = () => router.push({ pathname: '/practice-flashcards', params: { course: id } });

  const dotColor = (state?: CourseWordState) =>
    state === 'mastered' ? colors.primary
    : state === 'learning' ? '#d9a14a'
    : colors.surfaceHighest;

  const filtered = words.filter((w) => filter === 'all' || (w.state ?? 'new') === filter);

  const FilterPill = ({ value, label, color }: { value: WordFilter; label: string; color?: string }) => {
    const active = filter === value;
    return (
      <Pressable
        onPress={() => setFilter(value)}
        style={[
          styles.pill,
          active
            ? { backgroundColor: colors.primarySoft, borderColor: colors.primary }
            : { backgroundColor: colors.surface, borderColor: colors.outlineVariant },
        ]}
      >
        <Text style={[typography.label, { fontSize: 12, color: active ? colors.primary : (color ?? colors.onSurface) }]}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title={course.name} showBack />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.containerMargin, paddingBottom: 48 }}>

      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
        <Text style={[typography.headline, { color: colors.onSurface, flex: 1 }]}>{course.name}</Text>
        <View style={{ backgroundColor: colors.primary, borderRadius: radius.sm, paddingHorizontal: 9, paddingVertical: 4 }}>
          <Text style={[typography.label, { fontSize: 11, color: colors.onPrimary }]}>HSK {course.difficultyLevel}</Text>
        </View>
      </View>
      <Text style={[typography.label, { fontSize: 12.5, color: colors.outline, marginTop: spacing.sm }]}>
        {total} words · {course.subscriberCount} learners
        {course.ratingAvg != null ? ` · ★ ${course.ratingAvg.toFixed(1)}` : ''}
      </Text>
      {course.description ? <Text style={[typography.body, { color: colors.onSurfaceVariant, marginTop: spacing.sm }]}>{course.description}</Text> : null}

      {/* Progress card — only meaningful once enrolled */}
      {subscribed && (
        <View style={[styles.progressCard, { backgroundColor: colors.surface }]}>
          <CourseProgressRing learned={learned} total={total} />
          <View style={{ flex: 1 }}>
            <Text style={[typography.body, { color: colors.onSurface, fontFamily: fonts.headlineSemi }]}>{pct}% learned</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: spacing.sm, flexWrap: 'wrap' }}>
              {due > 0 && (
                <View style={[styles.chip, { backgroundColor: '#3a2f1a' }]}>
                  <Text style={[typography.label, { fontSize: 11, color: '#d9a14a' }]}>{due} due today</Text>
                </View>
              )}
              <View style={[styles.chip, { backgroundColor: colors.primarySoft }]}>
                <Text style={[typography.label, { fontSize: 11, color: colors.primary }]}>{learning} learning</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Primary action */}
      {subscribed ? (
        <Pressable style={[styles.studyBtn, { backgroundColor: colors.primary }]} onPress={startStudy}>
          <Icon name="play-arrow" size={20} color={colors.onPrimary} />
          <Text style={[typography.label, { fontSize: 15, color: colors.onPrimary }]}>
            {due > 0 ? `Study ${due} due word${due > 1 ? 's' : ''}` : 'Study this course'}
          </Text>
        </Pressable>
      ) : (
        <Pressable style={[styles.studyBtn, { backgroundColor: colors.primaryContainer }]} onPress={toggleSubscribe} disabled={busy}>
          <Icon name="bolt" size={20} color={colors.onPrimaryContainer} />
          <Text style={[typography.label, { fontSize: 15, color: colors.onPrimaryContainer }]}>
            {busy ? 'Enrolling…' : 'Enroll & start learning'}
          </Text>
        </Pressable>
      )}

      {subscribed && (
        <Pressable style={[styles.subToggle, { borderColor: colors.outlineVariant }]} onPress={toggleSubscribe} disabled={busy}>
          <Text style={[typography.label, { fontSize: 13, color: colors.onSurfaceVariant }]}>
            {busy ? '…' : '✓ Enrolled — tap to unsubscribe'}
          </Text>
        </Pressable>
      )}

      {subscribed && (
        <View style={styles.rateRow}>
          <Text style={[typography.body, { color: colors.onSurfaceVariant, marginRight: 4 }]}>Your rating:</Text>
          {[1, 2, 3, 4, 5].map((s) => (
            <Pressable key={s} onPress={() => handleRate(s)}>
              <Text style={{ color: '#d9a14a', fontSize: 26 }}>{s <= myRating ? '★' : '☆'}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Word filter pills */}
      <View style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7 }}>
          <FilterPill value="all" label={`All ${total}`} />
          <FilterPill value="new" label={`New ${newCount}`} />
          <FilterPill value="learning" label={`Learning ${learning}`} color="#d9a14a" />
          <FilterPill value="mastered" label={`✓ ${learned}`} color={colors.primary} />
        </ScrollView>
      </View>

      {filtered.map((w: CourseWord) => (
        <Pressable key={w.id} style={[styles.wordCard, { backgroundColor: colors.surface }]} onPress={() => speakChinese(w.word_zh)}>
          <View style={[styles.stateDot, { backgroundColor: dotColor(w.state) }]} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.hanzi, fontSize: 20, color: colors.onSurface }}>{w.word_zh}</Text>
            <Text style={[typography.pinyin, { color: colors.primary, marginTop: 2 }]}>{w.word_pinyin}</Text>
            <Text style={[typography.body, { color: colors.onSurfaceVariant, marginTop: 2 }]}>{w.word_en}</Text>
          </View>
          <Icon name="volume-up" size={18} color={colors.outline} />
          <Pressable
            onPress={() => setPickerWord(w)}
            disabled={savingId === w.id}
            hitSlop={8}
            style={{ marginLeft: spacing.sm }}
          >
            {savingId === w.id
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Icon name={savedIds.has(w.id) ? 'bookmark-added' : 'bookmark-add'} size={18} color={savedIds.has(w.id) ? colors.primary : colors.outline} />}
          </Pressable>
        </Pressable>
      ))}
      </ScrollView>

      <SaveToListSheet
        visible={pickerWord !== null}
        wordZh={pickerWord?.word_zh}
        lists={lists}
        onChoose={handleChooseList}
        onCancel={() => setPickerWord(null)}
        onListCreated={(list) => setLists((prev) => [list, ...prev])}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  progressCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.md },
  chip: { borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 },
  studyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, borderRadius: radius.pill, paddingVertical: 14, marginTop: spacing.md },
  subToggle: { borderWidth: 1, borderRadius: radius.md, paddingVertical: 10, alignItems: 'center', marginTop: spacing.sm },
  rateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.md },
  pill: { borderWidth: 1, borderRadius: radius.pill, paddingVertical: 7, paddingHorizontal: 13 },
  wordCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm },
  stateDot: { width: 9, height: 9, borderRadius: 5 },
});
