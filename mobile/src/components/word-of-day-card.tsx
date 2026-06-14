import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Alert } from 'react-native';
import { speakChinese } from '../lib/tts-speech-service';
import { fetchWordOfDay, saveWordOfDay, WordOfDay } from '../lib/stats-service';

// Daily curated HSK word shown on Home. Lets the user hear it, read an
// example, save it to their library, and run a quick self-test.
export function WordOfDayCard() {
  const [word, setWord] = useState<WordOfDay | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [practiceOpen, setPracticeOpen] = useState(false);

  useEffect(() => {
    fetchWordOfDay()
      .then((res) => {
        if (res) {
          setWord(res.word);
          setSaved(res.alreadySaved);
        }
      })
      .catch(() => {});
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
    <View style={styles.card}>
      <Text style={styles.label}>📅 Word of the Day</Text>

      <TouchableOpacity style={styles.row} onPress={() => speakChinese(word.word_zh)}>
        <Text style={styles.zh}>{word.word_zh}</Text>
        <View style={styles.headerRight}>
          {word.hsk_level != null && (
            <View style={styles.hskBadge}><Text style={styles.hskText}>HSK {word.hsk_level}</Text></View>
          )}
          <Text style={styles.speaker}>🔊</Text>
        </View>
      </TouchableOpacity>

      <Text style={styles.pinyin}>{word.word_pinyin}</Text>
      <Text style={styles.en}>{word.word_en}</Text>
      {word.example_sentence ? (
        <TouchableOpacity onPress={() => speakChinese(word.example_sentence!)}>
          <Text style={styles.example}>{word.example_sentence}</Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.actions}>
        {saved ? (
          <View style={[styles.actionButton, styles.savedButton]}>
            <Text style={styles.savedText}>✓ In your library</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.actionButton} onPress={handleSave} disabled={saving}>
            <Text style={styles.actionText}>{saving ? 'Saving…' : '+ Save'}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.actionButton} onPress={() => setPracticeOpen(true)}>
          <Text style={styles.actionText}>🎯 Practice</Text>
        </TouchableOpacity>
      </View>

      <WordPracticeModal
        word={word}
        visible={practiceOpen}
        onClose={() => setPracticeOpen(false)}
      />
    </View>
  );
}

// Lightweight single-word self-test: see the word, recall it, flip to check.
function WordPracticeModal({
  word, visible, onClose,
}: { word: WordOfDay; visible: boolean; onClose: () => void }) {
  const [flipped, setFlipped] = useState(false);

  // Reset to the front face each time the modal opens
  useEffect(() => { if (visible) setFlipped(false); }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <TouchableOpacity
          style={styles.flashcard}
          activeOpacity={0.9}
          onPress={() => setFlipped((f) => !f)}
        >
          <Text style={styles.flashZh}>{word.word_zh}</Text>
          <TouchableOpacity style={styles.flashSpeaker} onPress={() => speakChinese(word.word_zh)}>
            <Text style={{ fontSize: 24 }}>🔊</Text>
          </TouchableOpacity>
          {flipped ? (
            <View style={styles.flashAnswer}>
              <Text style={styles.flashPinyin}>{word.word_pinyin}</Text>
              <Text style={styles.flashEn}>{word.word_en}</Text>
              {word.example_sentence ? (
                <Text style={styles.flashExample}>{word.example_sentence}</Text>
              ) : null}
            </View>
          ) : (
            <Text style={styles.flashHint}>Tap to reveal</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>Done</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#9333ea22', borderColor: '#9333ea55', borderWidth: 1,
    borderRadius: 16, padding: 18, marginBottom: 20,
  },
  label: { color: '#c4b5fd', fontSize: 12, fontWeight: '600', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  zh: { color: '#fff', fontSize: 34, fontWeight: 'bold' },
  hskBadge: { backgroundColor: '#9333ea44', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  hskText: { color: '#e9d5ff', fontSize: 11, fontWeight: '600' },
  speaker: { fontSize: 20 },
  pinyin: { color: '#a855f7', fontSize: 16, marginTop: 2 },
  en: { color: '#e2e8f0', fontSize: 14, marginTop: 2 },
  example: { color: '#94a3b8', fontSize: 13, marginTop: 8, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  actionButton: {
    flex: 1, backgroundColor: '#1e293b', borderRadius: 10, paddingVertical: 10,
    borderWidth: 1, borderColor: '#334155',
  },
  actionText: { color: '#e2e8f0', textAlign: 'center', fontWeight: '600', fontSize: 13 },
  savedButton: { borderColor: '#22c55e', backgroundColor: '#16a34a22' },
  savedText: { color: '#4ade80', textAlign: 'center', fontWeight: '600', fontSize: 13 },
  // practice modal
  modalBackdrop: { flex: 1, backgroundColor: '#000000cc', justifyContent: 'center', padding: 24 },
  flashcard: {
    backgroundColor: '#1e293b', borderRadius: 20, padding: 32, minHeight: 280,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#334155',
  },
  flashZh: { color: '#fff', fontSize: 56, fontWeight: 'bold' },
  flashSpeaker: { marginTop: 12, padding: 8 },
  flashHint: { color: '#64748b', marginTop: 24, fontSize: 14 },
  flashAnswer: { alignItems: 'center', marginTop: 16 },
  flashPinyin: { color: '#a855f7', fontSize: 22 },
  flashEn: { color: '#e2e8f0', fontSize: 18, marginTop: 6 },
  flashExample: { color: '#94a3b8', fontSize: 14, marginTop: 14, fontStyle: 'italic', textAlign: 'center' },
  closeButton: { marginTop: 20, padding: 14 },
  closeText: { color: '#c4b5fd', textAlign: 'center', fontWeight: '600', fontSize: 16 },
});
