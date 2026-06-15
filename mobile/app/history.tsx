import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Pressable, ActivityIndicator, Alert } from 'react-native';
import { showError } from '../src/lib/toast';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  fetchHistory, fetchAnalysisDetail, deleteAnalysis, HistoryAnalysis,
} from '../src/lib/library-service';
import { setLatestAnalysisResult } from '../src/lib/analysis-result-store';
import type { DetectedWord } from '../src/lib/analysis-service';
import { useTheme } from '../src/theme/theme-context';
import { spacing, radius, typography, makeShadow } from '../src/theme/theme';
import { Icon } from '../src/theme/ui-primitives';
import { AppHeader } from '../src/components/app-header';

export default function HistoryScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [analyses, setAnalyses] = useState<HistoryAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setAnalyses(await fetchHistory()); } catch { /* keep prior */ } finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Open a past analysis in the same result UI used after capture, so users
  // can hear words and add them to a list.
  const openDetail = async (item: HistoryAnalysis) => {
    setOpening(item.id);
    try {
      const detail = await fetchAnalysisDetail(item.id);
      const words: DetectedWord[] = detail.detected_objects.map((w) => ({
        id: w.id,
        zh: w.zh,
        en: w.en,
        pinyin: w.pinyin,
        category: (w.category as DetectedWord['category']) ?? 'object',
      }));
      setLatestAnalysisResult({
        id: detail.id,
        imageUri: detail.image_url,
        sceneDescription: detail.scene_context?.description ?? '',
        words,
        usage: null,
      });
      router.push('/analysis-result');
    } catch {
      showError('Failed to open', 'Try again');
    } finally {
      setOpening(null);
    }
  };

  const confirmDelete = (item: HistoryAnalysis) => {
    Alert.alert('Delete analysis', 'Remove this photo analysis? Saved words are kept.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try { await deleteAnalysis(item.id); setAnalyses((prev) => prev.filter((a) => a.id !== item.id)); }
          catch { showError('Delete failed', 'Try again'); }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppHeader />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader />
    <FlatList
      style={{ flex: 1 }}
      data={analyses}
      keyExtractor={(a) => a.id}
      numColumns={2}
      columnWrapperStyle={{ gap: spacing.sm }}
      contentContainerStyle={{ padding: spacing.containerMargin, gap: spacing.sm }}
      ListHeaderComponent={
        <Text style={[typography.headline, { color: colors.onSurface, marginBottom: spacing.sm }]}>
          Analysis History
        </Text>
      }
      ListEmptyComponent={
        <View style={{ alignItems: 'center', marginTop: 80, width: '100%' }}>
          <Icon name="history" size={44} color={colors.outline} />
          <Text style={[typography.body, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.md }]}>No analyses yet. Capture a photo to begin!</Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          style={[styles.card, { backgroundColor: colors.surface, ...makeShadow(colors, 'card') }]}
          onPress={() => openDetail(item)}
          onLongPress={() => confirmDelete(item)}
        >
          <View>
            <Image source={{ uri: item.image_url }} style={styles.thumb} />
            {opening === item.id && (
              <View style={styles.thumbOverlay}><ActivityIndicator color="#fff" /></View>
            )}
            <View style={styles.countBadge}>
              <Icon name="visibility" size={12} color="#fff" />
              <Text style={styles.countText}>{item.detected_objects.length}</Text>
            </View>
          </View>
          <View style={{ padding: spacing.sm }}>
            <Text style={[typography.pinyin, { color: colors.onSurface }]} numberOfLines={2}>
              {item.scene_context?.description ?? 'No description'}
            </Text>
            <Text style={[typography.label, { fontSize: 10, color: colors.outline, marginTop: 4 }]}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </Pressable>
      )}
    />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, borderRadius: radius.lg, overflow: 'hidden' },
  thumb: { width: '100%', aspectRatio: 1 },
  thumbOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  countBadge: {
    position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3,
  },
  countText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
