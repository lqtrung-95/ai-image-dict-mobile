import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { fetchVocabulary, VocabularyItem } from '../src/lib/vocabulary-service';
import { VocabularyWordCard } from '../src/components/vocabulary-word-card';

export default function ListDetailScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const [items, setItems] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const page = await fetchVocabulary('', 0, id);
      setItems(page.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: name ?? 'List' }} />
      {loading ? (
        <ActivityIndicator size="large" color="#a855f7" style={{ marginTop: 48 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <Text style={styles.empty}>This list has no words yet.</Text>
          }
          renderItem={({ item }) => (
            <VocabularyWordCard
              item={item}
              onDeleted={(wid) => setItems((prev) => prev.filter((w) => w.id !== wid))}
              onLearnedChanged={(wid, isLearned) =>
                setItems((prev) => prev.map((w) => (w.id === wid ? { ...w, isLearned } : w)))
              }
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  error: { color: '#f87171', textAlign: 'center', marginTop: 48 },
  empty: { color: '#94a3b8', textAlign: 'center', marginTop: 64 },
});
