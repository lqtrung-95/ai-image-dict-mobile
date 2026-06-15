import { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchCourses, Course, CourseSort } from '../src/lib/courses-service';
import { useTheme } from '../src/theme/theme-context';
import { spacing, radius, typography, fonts, makeShadow } from '../src/theme/theme';
import { Icon } from '../src/theme/ui-primitives';
import { AppHeader } from '../src/components/app-header';

const SORTS: { value: CourseSort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Popular' },
  { value: 'rating', label: 'Top Rated' },
];

export default function CoursesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
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
      const data = await fetchCourses({ page, difficulty, sort, q: search });
      setCourses(data.courses); setTotalPages(data.totalPages);
    } catch { /* keep prior */ } finally { setLoading(false); }
  }, [page, difficulty, sort, search]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  const chipStyle = (active: boolean) => ({
    backgroundColor: active ? colors.primarySoft : colors.surface,
    borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 14,
    borderWidth: 1, borderColor: active ? colors.primary : colors.outlineVariant,
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title="Community Courses" showBack />
      <View style={{ flex: 1, padding: spacing.containerMargin }}>
      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
        <Icon name="search" size={20} color={colors.outline} />
        <TextInput
          style={{ flex: 1, color: colors.onSurface, fontFamily: fonts.body, fontSize: 15 }}
          placeholder="Search courses…"
          placeholderTextColor={colors.outline}
          value={search}
          onChangeText={(t) => { setSearch(t); setPage(1); }}
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
          <Text style={[styles.chipText, { color: difficulty === 'all' ? colors.primary : colors.onSurface }]}>All HSK</Text>
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
        <FlatList
          data={courses}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ paddingBottom: 120 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 64 }}>
              <Icon name="school" size={44} color={colors.outline} />
              <Text style={[typography.body, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.md, paddingHorizontal: spacing.xl }]}>
                No courses found. Courses can be created on the web app.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable style={[styles.card, { backgroundColor: colors.surface, ...makeShadow(colors, 'card') }]} onPress={() => router.push({ pathname: '/course-detail', params: { id: item.id } })}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Text style={[typography.heading, { color: colors.onSurface, flex: 1 }]} numberOfLines={1}>{item.name}</Text>
                <View style={{ backgroundColor: colors.primarySoft, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={[typography.label, { fontSize: 11, color: colors.primary }]}>HSK {item.difficultyLevel}</Text>
                </View>
              </View>
              {item.description ? <Text style={[typography.pinyin, { color: colors.onSurfaceVariant, marginTop: 6 }]} numberOfLines={2}>{item.description}</Text> : null}
              <Text style={[typography.label, { fontSize: 12, color: colors.outline, marginTop: spacing.sm }]}>
                {item.wordCount} words · {item.subscriberCount} learners
                {item.ratingAvg != null ? ` · ★ ${item.ratingAvg.toFixed(1)} (${item.ratingCount})` : ''}
                {item.creatorName ? ` · by ${item.creatorName}` : ''}
              </Text>
              {item.isSubscribed && item.progress ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 8 }}>
                  <View style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: colors.surfaceContainerHigh, overflow: 'hidden' }}>
                    <View style={{ height: '100%', borderRadius: 3, backgroundColor: colors.primary, width: `${item.progress.total > 0 ? Math.round((item.progress.learned / item.progress.total) * 100) : 0}%` }} />
                  </View>
                  <Text style={[typography.label, { fontSize: 11, color: colors.primary }]}>
                    {item.progress.learned}/{item.progress.total}
                  </Text>
                  {item.progress.due > 0 && (
                    <Text style={[typography.label, { fontSize: 11, color: '#d9a14a' }]}>· {item.progress.due} due</Text>
                  )}
                </View>
              ) : item.isSubscribed ? (
                <Text style={[typography.label, { fontSize: 12, color: colors.primary, marginTop: 6 }]}>✓ Subscribed</Text>
              ) : null}
            </Pressable>
          )}
          ListFooterComponent={
            totalPages > 1 ? (
              <View style={styles.pager}>
                <Pressable disabled={page <= 1} onPress={() => setPage((p) => p - 1)}>
                  <Text style={[typography.label, { fontSize: 14, color: page <= 1 ? colors.outlineVariant : colors.primary }]}>‹ Prev</Text>
                </Pressable>
                <Text style={[typography.label, { fontSize: 13, color: colors.onSurfaceVariant }]}>{page} / {totalPages}</Text>
                <Pressable disabled={page >= totalPages} onPress={() => setPage((p) => p + 1)}>
                  <Text style={[typography.label, { fontSize: 14, color: page >= totalPages ? colors.outlineVariant : colors.primary }]}>Next ›</Text>
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
  // Fixed-height wrapper: stops the horizontal chip row from being vertically
  // squeezed (and clipping the pills) once the FlatList fills the column below.
  filterRow: { height: 56, justifyContent: 'center', marginVertical: spacing.xs },
  // Explicit lineHeight prevents PlusJakartaSans descenders ("p", "g") clipping inside pills
  chipText: { fontFamily: fonts.label, fontSize: 13, lineHeight: 18, letterSpacing: 0.3 },
  card: { borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm },
  pager: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.md },
});
