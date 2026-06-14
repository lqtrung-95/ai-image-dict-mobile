import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { speakChinese } from '../lib/tts-speech-service';
import { generateNarrative, StoryNarrative } from '../lib/library-service';
import { useTheme } from '../theme/theme-context';
import { spacing, radius, typography, fonts } from '../theme/theme';
import { Icon } from '../theme/ui-primitives';

// "✨ AI Story" block: generates a short Chinese narrative from the story's
// vocabulary, sentence-by-sentence with pinyin, translation, and tap-to-listen.
export function StoryNarrativeSection({ storyId }: { storyId: string }) {
  const { colors } = useTheme();
  const [narrative, setNarrative] = useState<StoryNarrative | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTranslations, setShowTranslations] = useState(true);

  const generate = async () => {
    setLoading(true); setError(null);
    try { setNarrative(await generateNarrative(storyId)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Generation failed'); }
    finally { setLoading(false); }
  };

  const readAll = () => { if (narrative) speakChinese(narrative.sentences.map((s) => s.zh).join('')); };

  const cardStyle = [styles.card, { backgroundColor: colors.primarySoft, borderColor: colors.primaryFixed }];

  if (!narrative) {
    return (
      <View style={cardStyle}>
        <View style={styles.titleRow}>
          <Icon name="auto-awesome" size={18} color={colors.primary} />
          <Text style={[typography.heading, { fontSize: 16, color: colors.onSurface }]}>AI Story</Text>
        </View>
        <Text style={[typography.pinyin, { color: colors.onSurfaceVariant, marginTop: 6, marginBottom: spacing.md }]}>
          Let AI write a short Chinese story using the words from these photos.
        </Text>
        {error ? <Text style={[typography.pinyin, { color: colors.error, marginBottom: spacing.sm }]}>{error}</Text> : null}
        <Pressable style={[styles.genBtn, { backgroundColor: colors.primaryContainer }]} onPress={generate} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.onPrimaryContainer} /> : <Text style={[typography.label, { fontSize: 15, color: colors.onPrimaryContainer }]}>Generate Story</Text>}
        </Pressable>
      </View>
    );
  }

  return (
    <View style={cardStyle}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Icon name="auto-awesome" size={18} color={colors.primary} />
          <Text style={[typography.heading, { fontSize: 16, color: colors.onSurface }]}>AI Story</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <Pressable onPress={() => setShowTranslations((v) => !v)}>
            <Text style={[typography.label, { fontSize: 12, color: colors.primary }]}>{showTranslations ? 'Hide EN' : 'Show EN'}</Text>
          </Pressable>
          <Pressable onPress={readAll}>
            <Text style={[typography.label, { fontSize: 12, color: colors.primary }]}>Read all</Text>
          </Pressable>
        </View>
      </View>

      {narrative.sentences.map((s, i) => (
        <Pressable key={i} style={{ marginBottom: spacing.md }} onPress={() => speakChinese(s.zh)}>
          <Text style={{ fontFamily: fonts.hanzi, fontSize: 19, lineHeight: 30, color: colors.onSurface }}>{s.zh}</Text>
          <Text style={[typography.pinyin, { color: colors.primary, marginTop: 2 }]}>{s.pinyin}</Text>
          {showTranslations && <Text style={[typography.pinyin, { color: colors.onSurfaceVariant, marginTop: 2 }]}>{s.en}</Text>}
        </Pressable>
      ))}

      {narrative.wordsUsed.length > 0 && (
        <Text style={[typography.label, { fontSize: 12, color: colors.outline, marginTop: 6 }]}>
          Words practiced: {narrative.wordsUsed.join(' · ')}
        </Text>
      )}

      <Pressable style={{ marginTop: spacing.md, padding: spacing.sm }} onPress={generate} disabled={loading}>
        <Text style={[typography.label, { fontSize: 13, color: colors.primary, textAlign: 'center' }]}>{loading ? 'Writing…' : '↻ Write a different story'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  genBtn: { borderRadius: radius.md, padding: 14, alignItems: 'center' },
});
