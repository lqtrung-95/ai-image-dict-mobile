import { Text, Pressable, View, StyleSheet } from 'react-native';
import { speakChinese } from '../lib/tts-speech-service';
import { tapLight, tapSelection } from '../lib/haptics-service';
import type { DueWord, SrsRating } from '../lib/practice-service';
import { useTheme } from '../theme/theme-context';
import { spacing, radius, typography, fonts, makeShadow } from '../theme/theme';
import { Icon } from '../theme/ui-primitives';

const RATING_BUTTONS: { rating: SrsRating; label: string; color: string }[] = [
  { rating: 1, label: 'Again', color: '#ba181b' },
  { rating: 2, label: 'Hard', color: '#d9a14a' },
  { rating: 3, label: 'Good', color: '#2d6a4f' },
  { rating: 4, label: 'Easy', color: '#3b82f6' },
];

interface Props {
  word: DueWord;
  flipped: boolean;
  onFlip: () => void;
  onRate: (rating: SrsRating) => void;
}

// Front shows 汉字; back reveals pinyin/English/example + 4 SRS rating buttons.
export function PracticeFlashcard({ word, flipped, onFlip, onRate }: Props) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, justifyContent: 'center' }}>
      <Pressable
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.outlineVariant, ...makeShadow(colors, 'card') }]}
        onPress={() => { tapLight(); onFlip(); }}
      >
        <Text style={[styles.zh, { color: colors.onSurface }]}>{word.wordZh}</Text>
        <Pressable onPress={() => speakChinese(word.wordZh)} style={{ marginTop: spacing.md, padding: spacing.sm }}>
          <Icon name="volume-up" size={24} color={colors.primary} />
        </Pressable>

        {flipped ? (
          <View style={{ alignItems: 'center', marginTop: spacing.md }}>
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 22, color: colors.primary }}>{word.wordPinyin}</Text>
            <Text style={[typography.heading, { color: colors.onSurface, marginTop: spacing.xs }]}>{word.wordEn}</Text>
            {word.exampleSentence ? (
              <Text style={[typography.body, { color: colors.onSurfaceVariant, fontStyle: 'italic', marginTop: spacing.md, textAlign: 'center' }]}>
                {word.exampleSentence}
              </Text>
            ) : null}
          </View>
        ) : (
          <Text style={[typography.body, { color: colors.outline, marginTop: spacing.lg }]}>Tap to reveal</Text>
        )}
      </Pressable>

      {flipped && (
        <View style={styles.ratingRow}>
          {RATING_BUTTONS.map(({ rating, label, color }) => (
            <Pressable
              key={rating}
              style={({ pressed }) => [styles.ratingBtn, { borderColor: color, backgroundColor: colors.surface }, pressed && { transform: [{ scale: 0.96 }] }]}
              onPress={() => { tapSelection(); onRate(rating); }}
            >
              <Text style={[typography.label, { fontSize: 14, color }]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.xl, padding: spacing.xl, minHeight: 320, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  zh: { fontFamily: fonts.hanzi, fontSize: 72, textAlign: 'center' },
  ratingRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.lg },
  ratingBtn: { flex: 1, borderWidth: 1.5, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
});
