import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator,
  TextInput, ListRenderItemInfo, Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
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
import { useLocale } from '../src/lib/locale-react-context';
import { spacing, radius, typography, fonts } from '../src/theme/theme';
import { Icon } from '../src/theme/ui-primitives';

type WordFilter = 'all' | CourseWordState;

const WORDS_PER_PAGE = 50;

interface WordsPage {
  words: CourseWord[];
  page: number;
  totalPages: number;
  totalCount: number;
  filteredCount: number;
}

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { t, locale } = useLocale();

  const [detail, setDetail] = useState<CourseDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<WordFilter>('all');

  // Unsubscribe confirmation dialog
  const [showUnsubDialog, setShowUnsubDialog] = useState(false);

  // Word list state
  const [wordsPage, setWordsPage] = useState<WordsPage | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [allWords, setAllWords] = useState<CourseWord[]>([]);
  const [wordsLoading, setWordsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Save-to-list
  const [lists, setLists] = useState<VocabularyList[]>([]);
  const [pickerWord, setPickerWord] = useState<CourseWord | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);

  const buildUrl = useCallback((page: number, q: string) => {
    const base = `/api/courses/${id}?wordsPage=${page}&wordsLimit=${WORDS_PER_PAGE}`;
    return q ? `${base}&wordsSearch=${encodeURIComponent(q)}` : base;
  }, [id]);

  // Load course metadata (first page always)
  const loadCourse = useCallback(async (q = '') => {
    try {
      const data = await fetchCourseDetail(id, { url: buildUrl(1, q), locale });
      setDetail(data);
      const pg: WordsPage = {
        words: data.words ?? [],
        page: (data as any).wordsPage ?? 1,
        totalPages: (data as any).wordsTotalPages ?? 1,
        totalCount: (data as any).wordsTotalCount ?? (data.words?.length ?? 0),
        filteredCount: (data as any).wordsFilteredCount ?? (data.words?.length ?? 0),
      };
      setWordsPage(pg);
      setAllWords(pg.words);
      setCurrentPage(1);
      setHasMore(pg.page < pg.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    }
  }, [id, buildUrl, locale]);

  // Reload on focus so enrollment/unsubscription state is fresh when navigating back
  useFocusEffect(useCallback(() => { loadCourse(); }, [loadCourse]));
  useEffect(() => { fetchLists().then(setLists).catch(() => {}); }, []);

  const loadNextPage = useCallback(async () => {
    if (wordsLoading || !hasMore) return;
    const nextPage = currentPage + 1;
    setWordsLoading(true);
    try {
      const data = await fetchCourseDetail(id, { url: buildUrl(nextPage, search), locale });
      const newWords = data.words ?? [];
      setAllWords((prev) => [...prev, ...newWords]);
      setCurrentPage(nextPage);
      const totalPages = (data as any).wordsTotalPages ?? 1;
      setHasMore(nextPage < totalPages);
    } catch {
      // silently fail on load-more
    } finally {
      setWordsLoading(false);
    }
  }, [id, buildUrl, wordsLoading, hasMore, currentPage, search, locale]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(value);
      setAllWords([]);
      setCurrentPage(1);
      setHasMore(true);
      loadCourse(value);
    }, 350);
  };

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

  const dotColor = (state?: CourseWordState) =>
    state === 'mastered' ? colors.primary
    : state === 'learning' ? '#d9a14a'
    : colors.surfaceHighest;

  const toggleSubscribe = async () => {
    if (!detail) return;
    const wasSubscribed = detail.isSubscribed ?? detail.course.isSubscribed ?? false;
    if (wasSubscribed) {
      // Show confirmation dialog instead of unsubscribing immediately
      setRemoveWords(false);
      setShowUnsubDialog(true);
      return;
    }
    setBusy(true);
    try {
      await subscribeToCourse(id);
      router.push({ pathname: '/practice-flashcards', params: { course: id, title: encodeURIComponent(detail?.course.name ?? 'Course') } });
    } catch (err) {
      showError('Action failed', err instanceof Error ? err.message : 'Try again');
    } finally {
      setBusy(false);
    }
  };

  const confirmUnsubscribe = async () => {
    setShowUnsubDialog(false);
    setBusy(true);
    try {
      await unsubscribeFromCourse(id);
      await loadCourse(search);
    } catch (err) {
      showError('Action failed', err instanceof Error ? err.message : 'Try again');
    } finally {
      setBusy(false);
    }
  };

  const handleRate = async (stars: number) => {
    try {
      await rateCourse(id, stars);
      loadCourse(search);
    } catch (err) {
      showError('Rating failed', err instanceof Error ? err.message : 'Try again');
    }
  };

  const startStudy = () => router.push({
    pathname: '/practice-flashcards',
    params: { course: id, title: encodeURIComponent(detail?.course.name ?? 'Course') },
  });

  // Apply filter client-side on loaded words (filter only applies to loaded pages)
  const filtered = filter === 'all' ? allWords : allWords.filter((w) => (w.state ?? 'new') === filter);

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
        <Text style={[typography.label, { fontSize: 12, color: active ? colors.primary : (color ?? colors.onSurface) }]}>
          {label}
        </Text>
      </Pressable>
    );
  };

  const renderWordItem = ({ item: w, index }: ListRenderItemInfo<CourseWord>) => (
    <Pressable
      style={[styles.wordCard, { backgroundColor: colors.surface }]}
      onPress={() => speakChinese(w.word_zh)}
    >
      <Text style={[styles.wordIndex, { color: colors.outline }]}>
        {index + 1}
      </Text>
      <View style={[styles.stateDot, { backgroundColor: dotColor(w.state) }]} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.hanzi, fontSize: 20, color: colors.onSurface }}>{w.word_zh}</Text>
        <Text style={[typography.pinyin, { color: colors.primary, marginTop: 2 }]}>{w.word_pinyin}</Text>
        <Text style={[typography.body, { color: colors.onSurfaceVariant, marginTop: 2 }]}>{locale === 'vi' && w.word_vi ? w.word_vi : w.word_en}</Text>
        {w.example_sentence ? (
          <Text style={[typography.label, { fontSize: 11.5, color: colors.outline, marginTop: 3 }]} numberOfLines={2}>
            {w.example_sentence}
          </Text>
        ) : null}
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
          : <Icon
              name={savedIds.has(w.id) ? 'bookmark-added' : 'bookmark-add'}
              size={18}
              color={savedIds.has(w.id) ? colors.primary : colors.outline}
            />}
      </Pressable>
    </Pressable>
  );

  const renderFooter = () => {
    if (!wordsLoading) return null;
    return (
      <View style={styles.loadMore}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[typography.label, { fontSize: 12, color: colors.outline, marginLeft: 8 }]}>
          Loading more words…
        </Text>
      </View>
    );
  };

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppHeader title="Course" showBack />
        <View style={styles.centered}>
          <Text style={[typography.body, { color: colors.error }]}>{error}</Text>
        </View>
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppHeader title="Course" showBack />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  const { course, progress } = detail;
  const subscribed = detail.isSubscribed ?? course.isSubscribed ?? false;
  const myRating = detail.userRating?.rating ?? 0;
  const learned = progress?.learned ?? 0;
  const learning = progress?.learning ?? 0;
  const due = progress?.due ?? 0;
  const total = wordsPage?.totalCount ?? progress?.total ?? allWords.length;
  const newCount = total - learned - learning;
  const pct = total > 0 ? Math.round((learned / total) * 100) : 0;

  const ListHeader = (
    <View>
      {/* Course title */}
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
      {course.description ? (
        <Text style={[typography.body, { color: colors.onSurfaceVariant, marginTop: spacing.sm }]}>
          {course.description}
        </Text>
      ) : null}

      {/* Progress card */}
      {subscribed && (
        <View style={[styles.progressCard, { backgroundColor: colors.surface }]}>
          <CourseProgressRing learned={learned} total={total} />
          <View style={{ flex: 1 }}>
            <Text style={[typography.body, { color: colors.onSurface, fontFamily: fonts.headlineSemi }]}>
              {pct}% learned
            </Text>
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
            {due > 0 ? t(due > 1 ? 'courseDetail.studyDuePlural' : 'courseDetail.studyDue', { count: due }) : t('courseDetail.studyCourse')}
          </Text>
        </Pressable>
      ) : (
        <Pressable style={[styles.studyBtn, { backgroundColor: colors.primaryContainer }]} onPress={toggleSubscribe} disabled={busy}>
          <Icon name="bolt" size={20} color={colors.onPrimaryContainer} />
          <Text style={[typography.label, { fontSize: 15, color: colors.onPrimaryContainer }]}>
            {busy ? t('courseDetail.enrolling') : t('courseDetail.enroll')}
          </Text>
        </Pressable>
      )}

      {subscribed && (
        <Pressable style={[styles.subToggle, { borderColor: colors.outlineVariant }]} onPress={toggleSubscribe} disabled={busy}>
          <Text style={[typography.label, { fontSize: 13, color: colors.onSurfaceVariant }]}>
            {busy ? '…' : t('courseDetail.enrolled')}
          </Text>
        </Pressable>
      )}

      {/* Rating */}
      {subscribed && (
        <View style={styles.rateRow}>
          <Text style={[typography.body, { color: colors.onSurfaceVariant, marginRight: 4 }]}>{t('courseDetail.yourRating')}</Text>
          {[1, 2, 3, 4, 5].map((s) => (
            <Pressable key={s} onPress={() => handleRate(s)}>
              <Text style={{ color: '#d9a14a', fontSize: 26 }}>{s <= myRating ? '★' : '☆'}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Search box */}
      <View style={[styles.searchRow, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
        <Icon name="search" size={18} color={colors.outline} />
        <TextInput
          value={searchInput}
          onChangeText={handleSearchChange}
          placeholder={t('courseDetail.searchPlaceholder')}
          placeholderTextColor={colors.outline}
          style={[typography.body, { flex: 1, color: colors.onSurface, marginLeft: 8 }]}
        />
        {searchInput.length > 0 && (
          <Pressable onPress={() => handleSearchChange('')} hitSlop={8}>
            <Icon name="close" size={16} color={colors.outline} />
          </Pressable>
        )}
      </View>

      {/* Word count + filter pills */}
      <View style={{ marginTop: spacing.sm, marginBottom: spacing.xs }}>
        <Text style={[typography.label, { fontSize: 12, color: colors.outline, marginBottom: spacing.sm }]}>
          {search
            ? `${wordsPage?.filteredCount ?? filtered.length} of ${total} words`
            : `${total} words`}
          {allWords.length < (wordsPage?.filteredCount ?? total) ? ` · showing ${allWords.length}` : ''}
        </Text>
        <View style={{ flexDirection: 'row', gap: 7 }}>
          <FilterPill value="all" label={`All`} />
          <FilterPill value="new" label={`New ${newCount}`} />
          <FilterPill value="learning" label={`Learning ${learning}`} color="#d9a14a" />
          <FilterPill value="mastered" label={`✓ ${learned}`} color={colors.primary} />
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title={course.name} showBack />
      <FlatList
        data={filtered}
        keyExtractor={(w) => w.id}
        renderItem={renderWordItem}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={renderFooter}
        contentContainerStyle={{ padding: spacing.containerMargin, paddingBottom: 48 }}
        onEndReached={loadNextPage}
        onEndReachedThreshold={0.3}
        removeClippedSubviews
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={5}
      />

      <SaveToListSheet
        visible={pickerWord !== null}
        wordZh={pickerWord?.word_zh}
        lists={lists}
        onChoose={handleChooseList}
        onCancel={() => setPickerWord(null)}
        onListCreated={(list) => setLists((prev) => [list, ...prev])}
      />

      {/* Unsubscribe confirmation dialog */}
      <Modal visible={showUnsubDialog} transparent animationType="fade" onRequestClose={() => setShowUnsubDialog(false)}>
        <View style={styles.overlay}>
          <View style={[styles.dialog, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
            <Text style={[typography.heading, { color: colors.onSurface, marginBottom: spacing.sm }]}>
              {t('courseDetail.unsubscribeTitle')}
            </Text>
            <Text style={[typography.body, { color: colors.onSurfaceVariant, marginBottom: spacing.xl, lineHeight: 22 }]}>
              {t('courseDetail.unsubscribeBody')}
            </Text>

            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Pressable
                style={[styles.dialogBtn, { flex: 1, borderWidth: 1, borderColor: colors.outlineVariant, backgroundColor: colors.surface }]}
                onPress={() => setShowUnsubDialog(false)}
              >
                <Text style={[typography.label, { color: colors.onSurface }]}>{t('courseDetail.cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.dialogBtn, { flex: 1, backgroundColor: colors.error }]}
                onPress={confirmUnsubscribe}
              >
                <Text style={[typography.label, { color: colors.onError ?? '#fff' }]}>{t('courseDetail.unsubscribe')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  searchRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 10, marginTop: spacing.lg },
  wordCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm },
  wordIndex: { fontSize: 11, width: 22, textAlign: 'right', flexShrink: 0 },
  stateDot: { width: 9, height: 9, borderRadius: 5, flexShrink: 0 },
  loadMore: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  dialog: { width: '100%', borderRadius: radius.xl, padding: spacing.xl, borderWidth: 1 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  dialogBtn: { borderRadius: radius.md, paddingVertical: 12, alignItems: 'center' },
});
