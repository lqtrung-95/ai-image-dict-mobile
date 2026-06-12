import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { speakChinese } from '../lib/tts-speech-service';
import type { DueWord, SrsRating } from '../lib/practice-service';

const RATING_BUTTONS: { rating: SrsRating; label: string; color: string }[] = [
  { rating: 1, label: 'Again', color: '#ef4444' },
  { rating: 2, label: 'Hard', color: '#f97316' },
  { rating: 3, label: 'Good', color: '#22c55e' },
  { rating: 4, label: 'Easy', color: '#3b82f6' },
];

interface Props {
  word: DueWord;
  flipped: boolean;
  onFlip: () => void;
  onRate: (rating: SrsRating) => void;
}

// Single flashcard: front shows 汉字 only; back reveals pinyin/English/example
// plus the 4 SRS rating buttons (Anki-style).
export function PracticeFlashcard({ word, flipped, onFlip, onRate }: Props) {
  return (
    <View style={styles.wrapper}>
      <TouchableOpacity style={styles.card} onPress={onFlip} activeOpacity={0.9}>
        <Text style={styles.zh}>{word.wordZh}</Text>
        <TouchableOpacity onPress={() => speakChinese(word.wordZh)} style={styles.speaker}>
          <Text style={{ fontSize: 24 }}>🔊</Text>
        </TouchableOpacity>

        {flipped ? (
          <View style={styles.answer}>
            <Text style={styles.pinyin}>{word.wordPinyin}</Text>
            <Text style={styles.en}>{word.wordEn}</Text>
            {word.exampleSentence ? (
              <Text style={styles.example}>{word.exampleSentence}</Text>
            ) : null}
          </View>
        ) : (
          <Text style={styles.hint}>Tap to reveal</Text>
        )}
      </TouchableOpacity>

      {flipped && (
        <View style={styles.ratingRow}>
          {RATING_BUTTONS.map(({ rating, label, color }) => (
            <TouchableOpacity
              key={rating}
              style={[styles.ratingButton, { borderColor: color }]}
              onPress={() => onRate(rating)}
            >
              <Text style={[styles.ratingLabel, { color }]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, justifyContent: 'center' },
  card: {
    backgroundColor: '#1e293b', borderRadius: 20, padding: 32, minHeight: 320,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#334155',
  },
  zh: { color: '#fff', fontSize: 56, fontWeight: 'bold', textAlign: 'center' },
  speaker: { marginTop: 12, padding: 8 },
  hint: { color: '#64748b', marginTop: 24, fontSize: 14 },
  answer: { alignItems: 'center', marginTop: 16 },
  pinyin: { color: '#a855f7', fontSize: 24 },
  en: { color: '#e2e8f0', fontSize: 18, marginTop: 8, textAlign: 'center' },
  example: {
    color: '#94a3b8', fontSize: 14, marginTop: 16, fontStyle: 'italic', textAlign: 'center',
  },
  ratingRow: { flexDirection: 'row', gap: 8, marginTop: 20 },
  ratingButton: {
    flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 14,
    backgroundColor: '#1e293b',
  },
  ratingLabel: { textAlign: 'center', fontWeight: '700', fontSize: 15 },
});
