import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { fetchCourses, Course, CourseSort } from '../src/lib/courses-service';

const SORTS: { value: CourseSort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Popular' },
  { value: 'rating', label: 'Top Rated' },
];

export default function CoursesScreen() {
  const router = useRouter();
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
      setCourses(data.courses);
      setTotalPages(data.totalPages);
    } catch {
      // keep prior
    } finally {
      setLoading(false);
    }
  }, [page, difficulty, sort, search]);

  // Debounce search; immediate for filter/page changes
  useEffect(() => {
    const timer = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search courses…"
        placeholderTextColor="#64748b"
        value={search}
        onChangeText={(t) => { setSearch(t); setPage(1); }}
        autoCapitalize="none"
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ gap: 8 }}>
        {SORTS.map((s) => (
          <TouchableOpacity
            key={s.value}
            style={[styles.chip, sort === s.value && styles.chipActive]}
            onPress={() => { setSort(s.value); setPage(1); }}
          >
            <Text style={styles.chipText}>{s.label}</Text>
          </TouchableOpacity>
        ))}
        <View style={styles.chipDivider} />
        <TouchableOpacity
          style={[styles.chip, difficulty === 'all' && styles.chipActive]}
          onPress={() => { setDifficulty('all'); setPage(1); }}
        >
          <Text style={styles.chipText}>All HSK</Text>
        </TouchableOpacity>
        {[1, 2, 3, 4, 5, 6].map((lvl) => (
          <TouchableOpacity
            key={lvl}
            style={[styles.chip, difficulty === String(lvl) && styles.chipActive]}
            onPress={() => { setDifficulty(String(lvl)); setPage(1); }}
          >
            <Text style={styles.chipText}>HSK {lvl}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator size="large" color="#a855f7" style={{ marginTop: 48 }} />
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🎓</Text>
              <Text style={styles.emptyText}>No courses found. Courses can be created on the web app.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push({ pathname: '/course-detail', params: { id: item.id } })}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <View style={styles.hskBadge}>
                  <Text style={styles.hskText}>HSK {item.difficultyLevel}</Text>
                </View>
              </View>
              {item.description ? (
                <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
              ) : null}
              <Text style={styles.meta}>
                {item.wordCount} words · {item.subscriberCount} learners
                {item.ratingAvg != null ? ` · ★ ${item.ratingAvg.toFixed(1)} (${item.ratingCount})` : ''}
                {item.creatorName ? ` · by ${item.creatorName}` : ''}
              </Text>
              {item.isSubscribed && <Text style={styles.subscribed}>✓ Subscribed</Text>}
            </TouchableOpacity>
          )}
          ListFooterComponent={
            totalPages > 1 ? (
              <View style={styles.pager}>
                <TouchableOpacity disabled={page <= 1} onPress={() => setPage((p) => p - 1)}>
                  <Text style={[styles.pagerBtn, page <= 1 && styles.pagerDisabled]}>‹ Prev</Text>
                </TouchableOpacity>
                <Text style={styles.pagerText}>{page} / {totalPages}</Text>
                <TouchableOpacity disabled={page >= totalPages} onPress={() => setPage((p) => p + 1)}>
                  <Text style={[styles.pagerBtn, page >= totalPages && styles.pagerDisabled]}>Next ›</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  search: {
    backgroundColor: '#1e293b', borderRadius: 12, padding: 14, color: '#fff',
    borderWidth: 1, borderColor: '#334155', marginBottom: 10,
  },
  filterRow: { flexGrow: 0, marginBottom: 12 },
  chip: {
    backgroundColor: '#1e293b', borderRadius: 18, paddingVertical: 8, paddingHorizontal: 14,
    borderWidth: 1, borderColor: '#334155',
  },
  chipActive: { borderColor: '#a855f7', backgroundColor: '#9333ea22' },
  chipText: { color: '#e2e8f0', fontSize: 13 },
  chipDivider: { width: 1, backgroundColor: '#334155', marginHorizontal: 4 },
  empty: { alignItems: 'center', marginTop: 64 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: '#94a3b8', textAlign: 'center', paddingHorizontal: 32 },
  card: { backgroundColor: '#1e293b', borderRadius: 14, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { color: '#fff', fontSize: 17, fontWeight: '600', flex: 1 },
  hskBadge: { backgroundColor: '#9333ea33', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  hskText: { color: '#c4b5fd', fontSize: 11, fontWeight: '600' },
  desc: { color: '#94a3b8', fontSize: 13, marginTop: 6, lineHeight: 18 },
  meta: { color: '#64748b', fontSize: 12, marginTop: 8 },
  subscribed: { color: '#4ade80', fontSize: 12, marginTop: 6, fontWeight: '600' },
  pager: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, paddingVertical: 16 },
  pagerBtn: { color: '#a855f7', fontSize: 15, fontWeight: '600' },
  pagerDisabled: { color: '#475569' },
  pagerText: { color: '#94a3b8', fontSize: 14 },
});
