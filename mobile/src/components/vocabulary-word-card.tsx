import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { speakChinese } from '../lib/tts-speech-service';
import {
  VocabularyItem, setWordLearned, deleteWord,
} from '../lib/vocabulary-service';

interface Props {
  item: VocabularyItem;
  onDeleted: (id: string) => void;
  onLearnedChanged: (id: string, isLearned: boolean) => void;
}

// One row in the vocabulary list: tap to expand, speak, toggle learned, delete
export function VocabularyWordCard({ item, onDeleted, onLearnedChanged }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);

  const toggleLearned = async () => {
    setBusy(true);
    try {
      await setWordLearned(item.id, !item.isLearned);
      onLearnedChanged(item.id, !item.isLearned);
    } catch (err) {
      Alert.alert('Update failed', err instanceof Error ? err.message : 'Try again');
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert('Delete word', `Remove "${item.wordZh}" from your vocabulary?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteWord(item.id);
            onDeleted(item.id);
          } catch (err) {
            Alert.alert('Delete failed', err instanceof Error ? err.message : 'Try again');
          }
        },
      },
    ]);
  };

  return (
    <TouchableOpacity style={styles.card} onPress={() => setExpanded(!expanded)}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <View style={styles.header}>
            <Text style={styles.zh}>{item.wordZh}</Text>
            {item.hskLevel != null && (
              <View style={styles.hskBadge}>
                <Text style={styles.hskText}>HSK {item.hskLevel}</Text>
              </View>
            )}
            {item.isLearned && <Text style={styles.learnedBadge}>✓ learned</Text>}
          </View>
          <Text style={styles.pinyin}>{item.wordPinyin}</Text>
          <Text style={styles.en}>{item.wordEn}</Text>
        </View>
        <TouchableOpacity style={styles.speakButton} onPress={() => speakChinese(item.wordZh)}>
          <Text style={{ fontSize: 20 }}>🔊</Text>
        </TouchableOpacity>
      </View>

      {expanded && (
        <View style={styles.actions}>
          {item.exampleSentence ? (
            <Text style={styles.example}>{item.exampleSentence}</Text>
          ) : null}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, item.isLearned && styles.actionButtonActive]}
              onPress={toggleLearned}
              disabled={busy}
            >
              <Text style={styles.actionText}>
                {item.isLearned ? 'Mark as not learned' : 'Mark as learned'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={confirmDelete}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 10,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  zh: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  hskBadge: { backgroundColor: '#9333ea33', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  hskText: { color: '#c4b5fd', fontSize: 11, fontWeight: '600' },
  learnedBadge: { color: '#4ade80', fontSize: 12 },
  pinyin: { color: '#a855f7', fontSize: 14, marginTop: 2 },
  en: { color: '#94a3b8', fontSize: 14, marginTop: 2 },
  speakButton: { padding: 8 },
  actions: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 12 },
  example: { color: '#cbd5e1', fontSize: 14, marginBottom: 10, fontStyle: 'italic' },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionButton: {
    flex: 1, backgroundColor: '#0f172a', borderRadius: 8, padding: 10,
    borderWidth: 1, borderColor: '#475569',
  },
  actionButtonActive: { borderColor: '#4ade80' },
  actionText: { color: '#e2e8f0', textAlign: 'center', fontSize: 13 },
  deleteButton: {
    backgroundColor: '#0f172a', borderRadius: 8, padding: 10,
    borderWidth: 1, borderColor: '#ef4444', paddingHorizontal: 16,
  },
  deleteText: { color: '#ef4444', fontSize: 13 },
});
