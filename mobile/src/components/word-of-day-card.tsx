import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, Alert } from 'react-native';
import { speakChinese } from '../lib/tts-speech-service';
import { fetchWordOfDay, saveWordOfDay, WordOfDay } from '../lib/stats-service';
import { useTheme } from '../theme/theme-context';
import { spacing, radius, typography, fonts, makeShadow } from '../theme/theme';
import { Icon, Eyebrow } from '../theme/ui-primitives';

// Daily curated HSK word, styled as the Stitch "Word of the Day" rice-grid card.
export function WordOfDayCard() {
  const { colors } = useTheme();
  const [word, setWord] = useState<WordOfDay | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [practiceOpen, setPracticeOpen] = useState(false);

  useEffect(() => {
    fetchWordOfDay().then((res) => {
      if (res) { setWord(res.word); setSaved(res.alreadySaved); }
    }).catch(() => {});
  }, []);

  if (!word) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveWordOfDay(word);
      setSaved(true);
    } catch (err) {
      Alert.alert('Save failed', err instanceof Error ? err.message : 'Try again');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View>
      <View style={styles.headerRow}>
        <Eyebrow>Word of the Day</Eyebrow>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, ...makeShadow(colors, 'card') }]}>
        {/* Rice-grid (米字格) character box */}
        <View style={styles.center}>
          <View style={[styles.riceGrid, { borderColor: colors.outlineVariant, backgroundColor: colors.background }]}>
            <View style={[styles.gridLineV, { backgroundColor: colors.outlineVariant }]} />
            <View style={[styles.gridLineH, { backgroundColor: colors.outlineVariant }]} />
            <Text style={[styles.pinyinTop, { color: colors.outline }]}>{word.word_pinyin}</Text>
            <Text style={[styles.hanzi, { color: colors.onSurface }]}>{word.word_zh}</Text>
          </View>

          <Text style={[styles.meaning, { color: colors.primary }]}>{word.word_en}</Text>
          <View style={[styles.divider, { backgroundColor: colors.primaryFixed }]} />
          {word.example_sentence ? (
            <Text style={[styles.example, { color: colors.onSurfaceVariant }]}>{word.example_sentence}</Text>
          ) : null}
        </View>

        {/* Footer actions */}
        <View style={[styles.footer, { borderTopColor: colors.surfaceContainer }]}>
          <Pressable style={styles.footerBtn} onPress={() => speakChinese(word.word_zh)}>
            <Icon name="volume-up" size={18} color={colors.primary} />
            <Text style={[typography.label, { color: colors.primary }]}>Listen</Text>
          </Pressable>
          <Pressable style={styles.footerBtn} onPress={() => setPracticeOpen(true)}>
            <Icon name="school" size={18} color={colors.primary} />
            <Text style={[typography.label, { color: colors.primary }]}>Practice</Text>
          </Pressable>
          <Pressable style={styles.footerBtn} onPress={handleSave} disabled={saved || saving}>
            <Icon name={saved ? 'bookmark' : 'bookmark-border'} size={18} color={colors.primary} />
            <Text style={[typography.label, { color: colors.primary }]}>
              {saved ? 'Saved' : saving ? '…' : 'Save'}
            </Text>
          </Pressable>
        </View>
      </View>

      <WordPracticeModal word={word} visible={practiceOpen} onClose={() => setPracticeOpen(false)} />
    </View>
  );
}

function WordPracticeModal({ word, visible, onClose }: { word: WordOfDay; visible: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const [flipped, setFlipped] = useState(false);
  useEffect(() => { if (visible) setFlipped(false); }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable
          style={[styles.flashcard, { backgroundColor: colors.surface }]}
          onPress={() => setFlipped((f) => !f)}
        >
          <Text style={[styles.flashHanzi, { color: colors.onSurface }]}>{word.word_zh}</Text>
          <Pressable style={{ marginTop: spacing.md }} onPress={() => speakChinese(word.word_zh)}>
            <Icon name="volume-up" size={24} color={colors.primary} />
          </Pressable>
          {flipped ? (
            <View style={{ alignItems: 'center', marginTop: spacing.md }}>
              <Text style={{ fontFamily: fonts.bodyMedium, color: colors.primary, fontSize: 20 }}>{word.word_pinyin}</Text>
              <Text style={[typography.heading, { color: colors.onSurface, marginTop: 6 }]}>{word.word_en}</Text>
            </View>
          ) : (
            <Text style={[typography.body, { color: colors.outline, marginTop: spacing.lg }]}>Tap to reveal</Text>
          )}
        </Pressable>
        <Pressable style={{ marginTop: spacing.lg, padding: spacing.md }} onPress={onClose}>
          <Text style={[typography.label, { color: colors.primary, fontSize: 14 }]}>Done</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  headerRow: { marginBottom: spacing.sm },
  card: { borderRadius: radius.lg, padding: spacing.lg },
  center: { alignItems: 'center' },
  riceGrid: {
    width: 160, height: 160, borderWidth: 1, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  gridLineV: { position: 'absolute', width: 1, height: '100%', opacity: 0.4 },
  gridLineH: { position: 'absolute', height: 1, width: '100%', opacity: 0.4 },
  pinyinTop: { ...typography.pinyin, position: 'absolute', top: 14 },
  hanzi: { fontFamily: fonts.hanzi, fontSize: 64 },
  meaning: { fontFamily: fonts.headline, fontSize: 22, marginTop: spacing.lg },
  divider: { height: 2, width: 48, borderRadius: 1, marginVertical: spacing.sm },
  example: { ...typography.body, fontStyle: 'italic', textAlign: 'center', paddingHorizontal: spacing.md },
  footer: {
    flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1,
    marginTop: spacing.md, paddingTop: spacing.md,
  },
  footerBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 4 },
  modalBackdrop: { flex: 1, backgroundColor: '#000000aa', justifyContent: 'center', padding: spacing.lg },
  flashcard: {
    borderRadius: radius.xl, padding: spacing.xl, minHeight: 280,
    alignItems: 'center', justifyContent: 'center',
  },
  flashHanzi: { fontFamily: fonts.hanzi, fontSize: 72 },
});
