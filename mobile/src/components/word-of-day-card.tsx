import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { speakChinese } from '../lib/tts-speech-service';
import { fetchWordOfDay, WordOfDay } from '../lib/stats-service';

// Daily featured word from the user's own vocabulary, shown on Home.
export function WordOfDayCard() {
  const [word, setWord] = useState<WordOfDay | null>(null);

  useEffect(() => {
    fetchWordOfDay().then(setWord).catch(() => {});
  }, []);

  if (!word) return null;

  return (
    <TouchableOpacity style={styles.card} onPress={() => speakChinese(word.word_zh)} activeOpacity={0.85}>
      <Text style={styles.label}>📅 Word of the Day</Text>
      <View style={styles.row}>
        <Text style={styles.zh}>{word.word_zh}</Text>
        <Text style={styles.speaker}>🔊</Text>
      </View>
      <Text style={styles.pinyin}>{word.word_pinyin}</Text>
      <Text style={styles.en}>{word.word_en}</Text>
      {word.example_sentence ? <Text style={styles.example}>{word.example_sentence}</Text> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#9333ea22', borderColor: '#9333ea55', borderWidth: 1,
    borderRadius: 16, padding: 18, marginBottom: 20,
  },
  label: { color: '#c4b5fd', fontSize: 12, fontWeight: '600', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  zh: { color: '#fff', fontSize: 34, fontWeight: 'bold' },
  speaker: { fontSize: 20 },
  pinyin: { color: '#a855f7', fontSize: 16, marginTop: 2 },
  en: { color: '#e2e8f0', fontSize: 14, marginTop: 2 },
  example: { color: '#94a3b8', fontSize: 13, marginTop: 8, fontStyle: 'italic' },
});
