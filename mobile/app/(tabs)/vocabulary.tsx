import { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/lib/auth-context';
import { LoginRequiredPrompt } from '../../src/components/login-required-prompt';
import { VocabularyWordCard } from '../../src/components/vocabulary-word-card';
import { fetchVocabulary, VocabularyItem } from '../../src/lib/vocabulary-service';
import { useTheme } from '../../src/theme/theme-context';
import { spacing, radius, typography, fonts } from '../../src/theme/theme';
import { Eyebrow, Icon } from '../../src/theme/ui-primitives';

export default function VocabularyScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
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
    <View style={{ flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.containerMargin, paddingTop: insets.top + spacing.sm }}>
      <Text style={[typography.headline, { color: colors.onSurface, marginBottom: spacing.md }]}>Library</Text>

      <View style={[searchStyles.bar, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
        <Icon name="search" size={20} color={colors.outline} />
        <TextInput
          style={{ flex: 1, color: colors.onSurface, fontFamily: fonts.body, fontSize: 15 }}
          placeholder="Search 汉字, pinyin, or English…"
          placeholderTextColor={colors.outline}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
      </View>
      {!loading && !error && (
        <Eyebrow style={{ marginTop: spacing.md, marginBottom: spacing.sm }}>
          {total} {total === 1 ? 'word' : 'words'}
        </Eyebrow>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 48 }} />
      ) : error ? (
        <Text style={[typography.body, { color: colors.error, textAlign: 'center', marginTop: 48 }]}>{error}</Text>
      ) : items.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: 64 }}>
          <Icon name="menu-book" size={44} color={colors.outline} />
          <Text style={[typography.body, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.md }]}>
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
              onDeleted={(id) => { setItems((prev) => prev.filter((w) => w.id !== id)); setTotal((t) => t - 1); }}
              onLearnedChanged={(id, isLearned) =>
                setItems((prev) => prev.map((w) => (w.id === id ? { ...w, isLearned } : w)))
              }
            />
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} /> : null}
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      )}
    </View>
  );
}

import { StyleSheet } from 'react-native';
const searchStyles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.md, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: 12 },
});
