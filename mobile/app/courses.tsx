import { useCallback, useState } from 'react';
import { View, Text, TextInput, SectionList, Pressable, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../src/lib/auth-context';
import { fetchCourses, Course, CourseSort } from '../src/lib/courses-service';
import { useTheme } from '../src/theme/theme-context';
import { spacing, radius, typography, fonts, makeShadow } from '../src/theme/theme';
import { Icon } from '../src/theme/ui-primitives';
import { AppHeader } from '../src/components/app-header';
import { useLocale } from '../src/lib/locale-react-context';

const SORT_OPTIONS: CourseSort[] = ['newest', 'popular', 'rating'];

export default function CoursesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { t, locale } = useLocale();

  const SORTS: { value: CourseSort; label: string }[] = [
    { value: 'newest', label: t('courses.filterNewest') },
    { value: 'popular', label: t('courses.filterPopular') },
    { value: 'rating', label: t('courses.filterTopRated') },
  ];

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('all');
  const [sort, setSort] = useState<CourseSort>('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCourses({ page, difficulty, sort, q: search, locale });
      setCourses(data.courses);
      setTotalPages(data.totalPages);
    } catch { /* keep prior */ } finally { setLoading(false); }
  }, [page, difficulty, sort, search, locale]);

  useFocusEffect(useCallback(() => {
    const timer = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(timer);
  }, [load, search]));

  const enrolled = courses.filter((c) => c.isSubscribed);
  const available = courses.filter((c) => !c.isSubscribed);

  // Build SectionList sections — only include a section if it has items or if enrolled is empty
  const sections = [
    ...(enrolled.length > 0 ? [{ title: t('courses.sectionEnrolled'), data: enrolled }] : []),
    ...(available.length > 0 ? [{ title: t('courses.sectionAvailable'), data: available }] : []),
  ];

  const chipStyle = (active: boolean) => ({
    backgroundColor: active ? colors.primarySoft : colors.surface,
    borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 14,
    borderWidth: 1, borderColor: active ? colors.primary : colors.outlineVariant,
  });

  const renderCourseCard = ({ item }: { item: Course }) => (
    <Pressable
      style={[styles.card, { backgroundColor: colors.surface, ...makeShadow(colors, 'card') }]}
      onPress={() => router.push({ pathname: '/course-detail', params: { id: item.id } })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Text style={[typography.heading, { color: colors.onSurface, flex: 1 }]} numberOfLines={1}>{item.name}</Text>
        <View style={{ backgroundColor: colors.primarySoft, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 3 }}>
          <Text style={[typography.label, { fontSize: 11, color: colors.primary }]}>HSK {item.difficultyLevel}</Text>
        </View>
      </View>
      {item.description ? (
        <Text style={[typography.pinyin, { color: colors.onSurfaceVariant, marginTop: 6 }]} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}
      <Text style={[typography.label, { fontSize: 12, color: colors.outline, marginTop: spacing.sm }]}>
        {t('courses.wordsMeta', { words: item.wordCount, learners: item.subscriberCount })}
        {item.ratingAvg != null ? ` · ★ ${item.ratingAvg.toFixed(1)} (${item.ratingCount})` : ''}
        {item.creatorName ? ` ${t('courses.byCreator', { name: item.creatorName })}` : ''}
      </Text>
      {item.isSubscribed && item.progress ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 8 }}>
          <View style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: colors.surfaceContainerHigh, overflow: 'hidden' }}>
            <View style={{
              height: '100%', borderRadius: 3, backgroundColor: colors.primary,
              width: `${item.progress.total > 0 ? Math.round((item.progress.learned / item.progress.total) * 100) : 0}%`,
            }} />
          </View>
          <Text style={[typography.label, { fontSize: 11, color: colors.primary }]}>
            {item.progress.learned}/{item.progress.total}
          </Text>
          {item.progress.due > 0 && (
            <Text style={[typography.label, { fontSize: 11, color: '#d9a14a' }]}>
              · {t('courses.due', { count: item.progress.due })}
            </Text>
          )}
        </View>
      ) : item.isSubscribed ? (
        <Text style={[typography.label, { fontSize: 12, color: colors.primary, marginTop: 6 }]}>
          {t('courses.subscribed')}
        </Text>
      ) : null}
    </Pressable>
  );

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <Text style={[typography.label, { fontSize: 13, color: colors.onSurfaceVariant, marginBottom: spacing.xs, marginTop: spacing.sm, letterSpacing: 0.5, textTransform: 'uppercase' }]}>
      {section.title}
    </Text>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title={t('courses.title')} showBack />
      <View style={{ flex: 1, padding: spacing.containerMargin }}>

        {!user && (
          <Pressable
            style={[styles.premiumBanner, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/premium' as never)}
          >
            <Text style={{ fontSize: 20 }}>👑</Text>
            <View style={{ flex: 1 }}>
              <Text style={[typography.label, { fontSize: 13, color: colors.onPrimary }]}>{t('courses.unlockPremium')}</Text>
              <Text style={[typography.body, { fontSize: 12, color: colors.onPrimary, opacity: 0.85 }]}>
                {t('courses.unlimitedDesc')}
              </Text>
            </View>
            <Text style={[typography.label, { fontSize: 12, color: colors.onPrimary, opacity: 0.9 }]}>$3.50/mo →</Text>
          </Pressable>
        )}

        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
          <Icon name="search" size={20} color={colors.outline} />
          <TextInput
            style={{ flex: 1, color: colors.onSurface, fontFamily: fonts.body, fontSize: 15 }}
            placeholder={t('courses.searchPlaceholder')}
            placeholderTextColor={colors.outline}
            value={search}
            onChangeText={(v) => { setSearch(v); setPage(1); }}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs, alignItems: 'center', paddingRight: spacing.md }}>
            {SORTS.map((s) => (
              <Pressable key={s.value} style={chipStyle(sort === s.value)} onPress={() => { setSort(s.value); setPage(1); }}>
                <Text style={[styles.chipText, { color: sort === s.value ? colors.primary : colors.onSurface }]}>{s.label}</Text>
              </Pressable>
            ))}
            <View style={{ width: 1, height: 24, backgroundColor: colors.outlineVariant, marginHorizontal: 4 }} />
            <Pressable style={chipStyle(difficulty === 'all')} onPress={() => { setDifficulty('all'); setPage(1); }}>
              <Text style={[styles.chipText, { color: difficulty === 'all' ? colors.primary : colors.onSurface }]}>{t('courses.filterAllHsk')}</Text>
            </Pressable>
            {[1, 2, 3, 4, 5, 6].map((lvl) => (
              <Pressable key={lvl} style={chipStyle(difficulty === String(lvl))} onPress={() => { setDifficulty(String(lvl)); setPage(1); }}>
                <Text style={[styles.chipText, { color: difficulty === String(lvl) ? colors.primary : colors.onSurface }]}>HSK {lvl}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 48 }} />
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(c) => c.id}
            renderItem={renderCourseCard}
            renderSectionHeader={renderSectionHeader}
            contentContainerStyle={{ paddingBottom: 120 }}
            stickySectionHeadersEnabled={false}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', marginTop: 64 }}>
                <Icon name="school" size={44} color={colors.outline} />
                <Text style={[typography.body, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.md, paddingHorizontal: spacing.xl }]}>
                  {t('courses.empty')}
                </Text>
              </View>
            }
            ListFooterComponent={
              totalPages > 1 ? (
                <View style={styles.pager}>
                  <Pressable disabled={page <= 1} onPress={() => setPage((p) => p - 1)}>
                    <Text style={[typography.label, { fontSize: 14, color: page <= 1 ? colors.outlineVariant : colors.primary }]}>{t('courses.prev')}</Text>
                  </Pressable>
                  <Text style={[typography.label, { fontSize: 13, color: colors.onSurfaceVariant }]}>{page} / {totalPages}</Text>
                  <Pressable disabled={page >= totalPages} onPress={() => setPage((p) => p + 1)}>
                    <Text style={[typography.label, { fontSize: 14, color: page >= totalPages ? colors.outlineVariant : colors.primary }]}>{t('courses.next')}</Text>
                  </Pressable>
                </View>
              ) : null
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.md, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: 12 },
  filterRow: { height: 56, justifyContent: 'center', marginVertical: spacing.xs },
  chipText: { fontFamily: fonts.label, fontSize: 13, lineHeight: 18, letterSpacing: 0.3 },
  card: { borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm },
  pager: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.md },
  premiumBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    borderRadius: radius.lg, paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
});
