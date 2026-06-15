import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { fetchVocabulary, VocabularyItem } from '../src/lib/vocabulary-service';
import { VocabularyWordCard } from '../src/components/vocabulary-word-card';
import { AppHeader } from '../src/components/app-header';
import { useTheme } from '../src/theme/theme-context';
import { spacing, typography } from '../src/theme/theme';

export default function ListDetailScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const { colors } = useTheme();
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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title={name ?? 'List'} showBack />
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 48 }} />
      ) : error ? (
        <Text style={[typography.body, { color: colors.error, textAlign: 'center', marginTop: 48 }]}>{error}</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.containerMargin }}
          ListEmptyComponent={
            <Text style={[typography.body, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 64 }]}>This list has no words yet.</Text>
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
