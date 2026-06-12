import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { speakChinese } from '../lib/tts-speech-service';
import { generateNarrative, StoryNarrative } from '../lib/library-service';

// "✨ AI Story" block on the story detail screen: generates a short Chinese
// narrative from the story's vocabulary, sentence-by-sentence with pinyin,
// translation, and tap-to-listen.
export function StoryNarrativeSection({ storyId }: { storyId: string }) {
  const [narrative, setNarrative] = useState<StoryNarrative | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTranslations, setShowTranslations] = useState(true);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      setNarrative(await generateNarrative(storyId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const readAll = () => {
    if (!narrative) return;
    speakChinese(narrative.sentences.map((s) => s.zh).join(''));
  };

  if (!narrative) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>✨ AI Story</Text>
        <Text style={styles.subtitle}>
          Let AI write a short Chinese story using the words from these photos.
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={styles.generateButton} onPress={generate} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.generateText}>Generate Story</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>✨ AI Story</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowTranslations((v) => !v)}>
            <Text style={styles.headerAction}>{showTranslations ? 'Hide EN' : 'Show EN'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={readAll}>
            <Text style={styles.headerAction}>🔊 Read all</Text>
          </TouchableOpacity>
        </View>
      </View>

      {narrative.sentences.map((s, i) => (
        <TouchableOpacity key={i} style={styles.sentence} onPress={() => speakChinese(s.zh)}>
          <Text style={styles.zh}>{s.zh}</Text>
          <Text style={styles.pinyin}>{s.pinyin}</Text>
          {showTranslations && <Text style={styles.en}>{s.en}</Text>}
        </TouchableOpacity>
      ))}

      {narrative.wordsUsed.length > 0 && (
        <Text style={styles.wordsUsed}>
          Words practiced: {narrative.wordsUsed.join(' · ')}
        </Text>
      )}

      <TouchableOpacity style={styles.regenButton} onPress={generate} disabled={loading}>
        <Text style={styles.regenText}>{loading ? 'Writing…' : '↻ Write a different story'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#9333ea15', borderColor: '#9333ea44', borderWidth: 1,
    borderRadius: 16, padding: 18, marginBottom: 20,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerActions: { flexDirection: 'row', gap: 16 },
  headerAction: { color: '#c4b5fd', fontSize: 13, fontWeight: '600' },
  title: { color: '#fff', fontSize: 17, fontWeight: '700' },
  subtitle: { color: '#94a3b8', fontSize: 13, lineHeight: 19, marginTop: 6, marginBottom: 14 },
  error: { color: '#f87171', fontSize: 13, marginBottom: 10 },
  generateButton: { backgroundColor: '#9333ea', borderRadius: 12, padding: 14 },
  generateText: { color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 15 },
  sentence: { marginBottom: 12 },
  zh: { color: '#fff', fontSize: 19, lineHeight: 28 },
  pinyin: { color: '#a855f7', fontSize: 13, marginTop: 2 },
  en: { color: '#94a3b8', fontSize: 13, marginTop: 2 },
  wordsUsed: { color: '#64748b', fontSize: 12, marginTop: 6, lineHeight: 18 },
  regenButton: { marginTop: 14, padding: 10 },
  regenText: { color: '#c4b5fd', textAlign: 'center', fontSize: 13, fontWeight: '600' },
});
