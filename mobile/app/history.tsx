import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { speakChinese } from '../src/lib/tts-speech-service';
import {
  fetchHistory, fetchAnalysisDetail, deleteAnalysis, HistoryAnalysis, HistoryWord,
} from '../src/lib/library-service';

export default function HistoryScreen() {
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
    return <View style={[styles.container, styles.centered]}><ActivityIndicator size="large" color="#a855f7" /></View>;
  }

  return (
    <FlatList
      style={styles.container}
      data={analyses}
      keyExtractor={(a) => a.id}
      contentContainerStyle={{ padding: 16 }}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🕘</Text>
          <Text style={styles.emptyText}>No analyses yet. Capture a photo to begin!</Text>
        </View>
      }
      renderItem={({ item }) => {
        const expanded = expandedId === item.id;
        const words = wordsById[item.id];
        return (
          <TouchableOpacity
            style={styles.card}
            onPress={() => (expanded ? setExpandedId(null) : expand(item.id))}
            onLongPress={() => confirmDelete(item)}
          >
            <Image source={{ uri: item.image_url }} style={styles.thumb} />
            <Text style={styles.scene} numberOfLines={expanded ? undefined : 2}>
              {item.scene_context?.description ?? 'No description'}
            </Text>
            <Text style={styles.meta}>
              {item.detected_objects.length} words · {new Date(item.created_at).toLocaleDateString()}
            </Text>
            {expanded && (
              words === undefined ? (
                <ActivityIndicator color="#a855f7" style={{ marginTop: 12 }} />
              ) : (
                <View style={styles.words}>
                  {words.map((w) => (
                    <TouchableOpacity key={w.id} style={styles.wordChip} onPress={() => speakChinese(w.zh)}>
                      <Text style={styles.wordZh}>{w.zh}</Text>
                      <Text style={styles.wordEn}>{w.en}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )
            )}
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: '#94a3b8', textAlign: 'center', paddingHorizontal: 32 },
  card: { backgroundColor: '#1e293b', borderRadius: 14, padding: 12, marginBottom: 14 },
  thumb: { width: '100%', height: 160, borderRadius: 10, marginBottom: 10 },
  scene: { color: '#e2e8f0', fontSize: 14, lineHeight: 20 },
  meta: { color: '#64748b', fontSize: 12, marginTop: 6 },
  words: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  wordChip: { backgroundColor: '#0f172a', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10 },
  wordZh: { color: '#fff', fontSize: 16, fontWeight: '600' },
  wordEn: { color: '#94a3b8', fontSize: 11 },
});
