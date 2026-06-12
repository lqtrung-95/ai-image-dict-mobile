import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { speakChinese } from '../src/lib/tts-speech-service';
import { fetchStoryDetail, StoryDetail } from '../src/lib/library-service';
import { StoryNarrativeSection } from '../src/components/story-narrative-section';

// A story reads top-to-bottom: each photo with its scene words underneath,
// so users can "re-walk" the moment and review its vocabulary in context.
export default function StoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [story, setStory] = useState<StoryDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStoryDetail(id)
      .then(setStory)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'));
  }, [id]);

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (!story) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#a855f7" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <Stack.Screen options={{ title: story.title }} />

      {story.description ? <Text style={styles.description}>{story.description}</Text> : null}
      <Text style={styles.meta}>
        {story.photos.length} photos · {story.vocabularyCount} unique words
      </Text>

      <StoryNarrativeSection storyId={id} />

      {story.photos.map((photo, i) => (
        <View key={photo.story_photo_id} style={styles.photoBlock}>
          <Image source={{ uri: photo.image_url }} style={styles.photo} />
          {photo.caption ? <Text style={styles.caption}>{photo.caption}</Text> : null}
          {photo.vocabulary.length > 0 ? (
            <View style={styles.words}>
              {photo.vocabulary.map((w) => (
                <TouchableOpacity
                  key={w.id}
                  style={styles.wordChip}
                  onPress={() => speakChinese(w.label_zh)}
                >
                  <Text style={styles.wordZh}>{w.label_zh}</Text>
                  <Text style={styles.wordPinyin}>{w.pinyin}</Text>
                  <Text style={styles.wordEn}>{w.label_en}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.noWords}>No words detected for this photo</Text>
          )}
          {i < story.photos.length - 1 && <View style={styles.divider} />}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  error: { color: '#f87171' },
  description: { color: '#cbd5e1', fontSize: 15, lineHeight: 22, marginBottom: 4 },
  meta: { color: '#64748b', fontSize: 13, marginBottom: 16 },
  photoBlock: { marginBottom: 8 },
  photo: { width: '100%', height: 220, borderRadius: 14 },
  caption: { color: '#94a3b8', fontSize: 13, marginTop: 8, fontStyle: 'italic' },
  words: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  wordChip: {
    backgroundColor: '#1e293b', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12,
    borderWidth: 1, borderColor: '#334155', alignItems: 'center',
  },
  wordZh: { color: '#fff', fontSize: 18, fontWeight: '600' },
  wordPinyin: { color: '#a855f7', fontSize: 11 },
  wordEn: { color: '#94a3b8', fontSize: 11 },
  noWords: { color: '#64748b', fontSize: 13, marginTop: 10 },
  divider: { height: 1, backgroundColor: '#1e293b', marginVertical: 20 },
});
