import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { speakChinese } from '../src/lib/tts-speech-service';
import {
  fetchHistory, fetchAnalysisDetail, deleteAnalysis, HistoryAnalysis, HistoryWord,
} from '../src/lib/library-service';
import { useTheme } from '../src/theme/theme-context';
import { spacing, radius, typography, fonts, makeShadow } from '../src/theme/theme';
import { Icon } from '../src/theme/ui-primitives';

export default function HistoryScreen() {
  const { colors } = useTheme();
  const [analyses, setAnalyses] = useState<HistoryAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Full word data per analysis, loaded lazily on expand (list endpoint only has IDs)
  const [wordsById, setWordsById] = useState<Record<string, HistoryWord[]>>({});

  const expand = async (id: string) => {
    setExpandedId(id);
    if (!wordsById[id]) {
      try {
        const detail = await fetchAnalysisDetail(id);
        setWordsById((prev) => ({ ...prev, [id]: detail.detected_objects }));
      } catch {
        setWordsById((prev) => ({ ...prev, [id]: [] }));
      }
    }
  };

  const load = useCallback(async () => {
    try {
      setAnalyses(await fetchHistory());
    } catch {
      // keep prior on transient error
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const confirmDelete = (item: HistoryAnalysis) => {
    Alert.alert('Delete analysis', 'Remove this photo analysis? Saved words are kept.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAnalysis(item.id);
            setAnalyses((prev) => prev.filter((a) => a.id !== item.id));
          } catch {
            Alert.alert('Delete failed', 'Try again');
          }
        },
      },
    ]);
  };

  if (loading) {
    return <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.background }}
      data={analyses}
      keyExtractor={(a) => a.id}
      contentContainerStyle={{ padding: spacing.containerMargin }}
      ListEmptyComponent={
        <View style={{ alignItems: 'center', marginTop: 80 }}>
          <Icon name="history" size={44} color={colors.outline} />
          <Text style={[typography.body, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.md }]}>No analyses yet. Capture a photo to begin!</Text>
        </View>
      }
      renderItem={({ item }) => {
        const expanded = expandedId === item.id;
        const words = wordsById[item.id];
        return (
          <Pressable
            style={[styles.card, { backgroundColor: colors.surface, ...makeShadow(colors, 'card') }]}
            onPress={() => (expanded ? setExpandedId(null) : expand(item.id))}
            onLongPress={() => confirmDelete(item)}
          >
            <Image source={{ uri: item.image_url }} style={styles.thumb} />
            <Text style={[typography.body, { color: colors.onSurface }]} numberOfLines={expanded ? undefined : 2}>
              {item.scene_context?.description ?? 'No description'}
            </Text>
            <Text style={[typography.label, { fontSize: 12, color: colors.outline, marginTop: 6 }]}>
              {item.detected_objects.length} words · {new Date(item.created_at).toLocaleDateString()}
            </Text>
            {expanded && (
              words === undefined ? (
                <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />
              ) : (
                <View style={styles.words}>
                  {words.map((w) => (
                    <Pressable key={w.id} style={[styles.wordChip, { backgroundColor: colors.primarySoft }]} onPress={() => speakChinese(w.zh)}>
                      <Text style={{ fontFamily: fonts.hanzi, fontSize: 16, color: colors.onSurface }}>{w.zh}</Text>
                      <Text style={[typography.label, { fontSize: 10, color: colors.outline }]}>{w.en}</Text>
                    </Pressable>
                  ))}
                </View>
              )
            )}
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: spacing.sm, marginBottom: spacing.md },
  thumb: { width: '100%', height: 160, borderRadius: radius.md, marginBottom: spacing.sm },
  words: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  wordChip: { borderRadius: radius.md, paddingVertical: 6, paddingHorizontal: 10, alignItems: 'center' },
});
