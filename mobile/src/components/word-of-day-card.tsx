import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, Alert, Animated, ActivityIndicator } from 'react-native';
import { speakChinese } from '../lib/tts-speech-service';
import { fetchWordOfDay, saveWordOfDay, WordOfDay } from '../lib/stats-service';
import { useTheme } from '../theme/theme-context';
import { useLocale } from '../lib/locale-react-context';
import { spacing, radius, typography, fonts, makeShadow } from '../theme/theme';
import { Icon, Eyebrow } from '../theme/ui-primitives';

function SkeletonBlock({ width, height, style }: { width: number | string; height: number; style?: object }) {
  const { colors } = useTheme();
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
    return () => anim.stopAnimation();
  }, [anim]);
  return (
    <Animated.View
      style={[{ width, height, borderRadius: 6, backgroundColor: colors.surfaceContainer, opacity: anim }, style]}
    />
  );
}

function WordOfDayCardSkeleton() {
  const { colors } = useTheme();
  return (
    <View>
      <View style={styles.headerRow}>
        <SkeletonBlock width={120} height={12} />
      </View>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <View style={styles.center}>
          <SkeletonBlock width={160} height={160} style={{ borderRadius: 8 }} />
          <SkeletonBlock width={100} height={22} style={{ marginTop: spacing.lg }} />
          <SkeletonBlock width={48} height={2} style={{ marginVertical: spacing.sm }} />
          <SkeletonBlock width={220} height={14} style={{ marginTop: 4 }} />
          <SkeletonBlock width={180} height={12} style={{ marginTop: 6 }} />
        </View>
        <View style={[styles.footer, { borderTopColor: colors.surfaceContainer }]}>
          {[0, 1, 2].map((i) => <SkeletonBlock key={i} width={60} height={20} />)}
        </View>
      </View>
    </View>
  );
}

// Daily curated HSK word, styled as the Stitch "Word of the Day" rice-grid card.
export function WordOfDayCard() {
  const { colors } = useTheme();
  const { locale, t } = useLocale();
  const [word, setWord] = useState<WordOfDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [practiceOpen, setPracticeOpen] = useState(false);

  useEffect(() => {
    fetchWordOfDay(locale).then((res) => {
      if (res) { setWord(res.word); setSaved(res.alreadySaved); }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <WordOfDayCardSkeleton />;
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
        <Eyebrow>{t('wordOfDay.title')}</Eyebrow>
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

          <Text style={[styles.meaning, { color: colors.primary }]}>{locale === 'vi' && word.word_vi ? word.word_vi : word.word_en}</Text>
          <View style={[styles.divider, { backgroundColor: colors.primaryFixed }]} />
          {word.example_sentence ? (
            <Text style={[styles.example, { color: colors.onSurfaceVariant }]}>{word.example_sentence}</Text>
          ) : null}
          {locale === 'vi' && word.example_sentence_vi ? (
            <Text style={[styles.exampleEn, { color: colors.outline }]}>{word.example_sentence_vi}</Text>
          ) : word.example_sentence_en ? (
            <Text style={[styles.exampleEn, { color: colors.outline }]}>{word.example_sentence_en}</Text>
          ) : null}
        </View>

        {/* Footer actions */}
        <View style={[styles.footer, { borderTopColor: colors.surfaceContainer }]}>
          <Pressable style={styles.footerBtn} onPress={() => speakChinese(word.word_zh)}>
            <Icon name="volume-up" size={18} color={colors.primary} />
            <Text style={[typography.label, { color: colors.primary }]}>{t('wordOfDay.listen')}</Text>
          </Pressable>
          <Pressable style={styles.footerBtn} onPress={() => setPracticeOpen(true)}>
            <Icon name="school" size={18} color={colors.primary} />
            <Text style={[typography.label, { color: colors.primary }]}>{t('wordOfDay.practice')}</Text>
          </Pressable>
          <Pressable style={styles.footerBtn} onPress={handleSave} disabled={saved || saving}>
            {saving
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Icon name={saved ? 'bookmark' : 'bookmark-border'} size={18} color={colors.primary} />
            }
            <Text style={[typography.label, { color: colors.primary }]}>
              {saved ? t('wordOfDay.saved') : saving ? t('wordOfDay.saving') : t('wordOfDay.save')}
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
  const { t, locale } = useLocale();
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
              <Text style={[typography.heading, { color: colors.onSurface, marginTop: 6 }]}>{locale === 'vi' && word.word_vi ? word.word_vi : word.word_en}</Text>
            </View>
          ) : (
            <Text style={[typography.body, { color: colors.outline, marginTop: spacing.lg }]}>{t('wordOfDay.tapToReveal')}</Text>
          )}
        </Pressable>
        <Pressable style={{ marginTop: spacing.lg, padding: spacing.md }} onPress={onClose}>
          <Text style={[typography.label, { color: colors.primary, fontSize: 14 }]}>{t('wordOfDay.done')}</Text>
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
  exampleEn: { ...typography.pinyin, fontSize: 13, fontStyle: 'italic', textAlign: 'center', paddingHorizontal: spacing.md, marginTop: 4 },
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
