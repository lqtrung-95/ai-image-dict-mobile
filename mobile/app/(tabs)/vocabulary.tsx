import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useAuth } from '../../src/lib/auth-context';
import { LoginRequiredPrompt } from '../../src/components/login-required-prompt';
import { VocabularyWordCard } from '../../src/components/vocabulary-word-card';
import { fetchVocabulary, VocabularyItem } from '../../src/lib/vocabulary-service';

export default function VocabularyScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<VocabularyItem[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (query: string, append = false, offset = 0) => {
    try {
      setError(null);
      const page = await fetchVocabulary(query, offset);
      setItems((prev) => (append ? [...prev, ...page.items] : page.items));
      setTotal(page.total);
      setHasMore(page.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    }
  }, []);

  // Initial load + debounced search
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const timer = setTimeout(async () => {
      await load(search);
      setLoading(false);
    }, search ? 350 : 0);
    return () => clearTimeout(timer);
  }, [user, search, load]);

  if (!user) {
    return <LoginRequiredPrompt message="Log in to build and review your personal vocabulary library." />;
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await load(search);
    setRefreshing(false);
  };

  const onEndReached = async () => {
    if (!hasMore || loadingMore || loading) return;
    setLoadingMore(true);
    await load(search, true, items.length);
    setLoadingMore(false);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search 汉字, pinyin, or English…"
        placeholderTextColor="#64748b"
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
      />
      {!loading && !error && (
        <Text style={styles.count}>{total} {total === 1 ? 'word' : 'words'}</Text>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#a855f7" style={{ marginTop: 48 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📚</Text>
          <Text style={styles.emptyText}>
            {search ? 'No words match your search.' : 'No words yet.\nCapture a photo to start collecting vocabulary!'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <VocabularyWordCard
              item={item}
              onDeleted={(id) => {
                setItems((prev) => prev.filter((w) => w.id !== id));
                setTotal((t) => t - 1);
              }}
              onLearnedChanged={(id, isLearned) =>
                setItems((prev) =>
                  prev.map((w) => (w.id === id ? { ...w, isLearned } : w))
                )
              }
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a855f7" />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color="#a855f7" style={{ marginVertical: 16 }} /> : null
          }
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  search: {
    backgroundColor: '#1e293b', borderRadius: 12, padding: 14, color: '#fff',
    borderWidth: 1, borderColor: '#334155', marginBottom: 8,
  },
  count: { color: '#64748b', fontSize: 13, marginBottom: 12 },
  error: { color: '#f87171', textAlign: 'center', marginTop: 48 },
  empty: { alignItems: 'center', marginTop: 64 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: '#94a3b8', textAlign: 'center', lineHeight: 22 },
});
