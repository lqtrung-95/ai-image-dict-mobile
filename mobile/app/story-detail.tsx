import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { speakChinese } from '../src/lib/tts-speech-service';
import { fetchStoryDetail, StoryDetail } from '../src/lib/library-service';
import { StoryNarrativeSection } from '../src/components/story-narrative-section';
import { AppHeader } from '../src/components/app-header';
import { useTheme } from '../src/theme/theme-context';
import { spacing, radius, typography, fonts } from '../src/theme/theme';

// A story reads top-to-bottom: each photo with its scene words underneath,
// so users can "re-walk" the moment and review its vocabulary in context.
export default function StoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [story, setStory] = useState<StoryDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStoryDetail(id)
      .then(setStory)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'));
  }, [id]);

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppHeader title="Story" showBack />
        <View style={styles.center}><Text style={[typography.body, { color: colors.error }]}>{error}</Text></View>
      </View>
    );
  }
  if (!story) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppHeader title="Story" showBack />
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title={story.title} showBack />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.containerMargin, paddingBottom: 48 }}>

      {story.description ? <Text style={[typography.body, { color: colors.onSurfaceVariant, marginBottom: 4 }]}>{story.description}</Text> : null}
      <Text style={[typography.label, { fontSize: 13, color: colors.outline, marginBottom: spacing.md }]}>
        {story.photos.length} photos · {story.vocabularyCount} unique words
      </Text>

      <StoryNarrativeSection storyId={id} />

      {story.photos.map((photo, i) => (
        <View key={photo.story_photo_id} style={{ marginBottom: spacing.sm }}>
          <Image source={{ uri: photo.image_url }} style={styles.photo} />
          {photo.caption ? <Text style={[typography.pinyin, { color: colors.onSurfaceVariant, marginTop: spacing.sm, fontStyle: 'italic' }]}>{photo.caption}</Text> : null}
          {photo.vocabulary.length > 0 ? (
            <View style={styles.words}>
              {photo.vocabulary.map((w) => (
                <Pressable key={w.id} style={[styles.wordChip, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]} onPress={() => speakChinese(w.label_zh)}>
                  <Text style={{ fontFamily: fonts.hanzi, fontSize: 18, color: colors.onSurface }}>{w.label_zh}</Text>
                  <Text style={[typography.label, { fontSize: 10, color: colors.primary }]}>{w.pinyin}</Text>
                  <Text style={[typography.label, { fontSize: 10, color: colors.outline }]}>{w.label_en}</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <Text style={[typography.pinyin, { color: colors.outline, marginTop: spacing.sm }]}>No words detected for this photo</Text>
          )}
          {i < story.photos.length - 1 && <View style={{ height: 1, backgroundColor: colors.surfaceContainerHigh, marginVertical: spacing.lg }} />}
        </View>
      ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  photo: { width: '100%', height: 220, borderRadius: radius.lg },
  words: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.md },
  wordChip: { borderRadius: radius.md, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, alignItems: 'center' },
});
