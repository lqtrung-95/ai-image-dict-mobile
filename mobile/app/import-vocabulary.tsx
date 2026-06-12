import { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { speakChinese } from '../src/lib/tts-speech-service';
import { ListPickerRow } from '../src/components/list-picker-row';
import {
  startImport, saveImportedWords, ImportSourceType, ExtractedWord, ImportPreview,
} from '../src/lib/import-service';

type Phase = 'input' | 'extracting' | 'preview' | 'saving';

export default function ImportVocabularyScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('input');
  const [type, setType] = useState<ImportSourceType>('url');
  const [source, setSource] = useState('');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [listId, setListId] = useState<string | null>(null);

  const handleExtract = async () => {
    if (!source.trim()) return;
    setPhase('extracting');
    try {
      const result = await startImport(type, source.trim());
      setPreview(result);
      // Pre-select everything; user deselects what they don't want
      setSelected(new Set(result.preview.map((_, i) => i)));
      setPhase('preview');
    } catch (err) {
      Alert.alert('Extraction failed', err instanceof Error ? err.message : 'Try again');
      setPhase('input');
    }
  };

  const toggleWord = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  const handleSave = async () => {
    if (!preview || selected.size === 0) return;
    setPhase('saving');
    try {
      const words: ExtractedWord[] = preview.preview.filter((_, i) => selected.has(i));
      const { saved } = await saveImportedWords(preview.importId, words, listId ?? undefined);
      Alert.alert('Imported!', `${saved} words added to your vocabulary.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Save failed', err instanceof Error ? err.message : 'Try again');
      setPhase('preview');
    }
  };

  if (phase === 'extracting' || phase === 'saving') {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#a855f7" />
        <Text style={styles.loadingText}>
          {phase === 'extracting' ? 'AI is extracting vocabulary…' : 'Saving words…'}
        </Text>
      </View>
    );
  }

  if (phase === 'preview' && preview) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <Text style={styles.sourceTitle}>{preview.sourceTitle}</Text>
        <Text style={styles.subtitle}>
          {preview.preview.length} words found · {selected.size} selected (tap to toggle)
        </Text>

        <View style={{ marginBottom: 16 }}>
          <ListPickerRow selectedListId={listId} onSelect={setListId} />
        </View>

        {preview.preview.map((w, i) => {
          const isSel = selected.has(i);
          return (
            <TouchableOpacity
              key={`${w.zh}-${i}`}
              style={[styles.wordCard, isSel && styles.wordCardSelected]}
              onPress={() => toggleWord(i)}
              onLongPress={() => speakChinese(w.zh)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.wordZh}>{w.zh}</Text>
                <Text style={styles.wordPinyin}>{w.pinyin}</Text>
                <Text style={styles.wordEn}>{w.en}</Text>
              </View>
              <Text style={styles.checkmark}>{isSel ? '☑' : '☐'}</Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={[styles.primaryButton, selected.size === 0 && styles.disabled]}
          onPress={handleSave}
          disabled={selected.size === 0}
        >
          <Text style={styles.primaryButtonText}>Save {selected.size} words</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => setPhase('input')}>
          <Text style={styles.secondaryButtonText}>Start over</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // input phase
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.subtitle}>
        Import Chinese vocabulary from a web article or pasted text. AI extracts the words for you.
      </Text>

      <View style={styles.segmentRow}>
        <TouchableOpacity
          style={[styles.segment, type === 'url' && styles.segmentActive]}
          onPress={() => setType('url')}
        >
          <Text style={styles.segmentText}>🔗 From URL</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, type === 'text' && styles.segmentActive]}
          onPress={() => setType('text')}
        >
          <Text style={styles.segmentText}>📋 Paste Text</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={[styles.input, type === 'text' && styles.textArea]}
        placeholder={type === 'url' ? 'https://example.com/chinese-article' : 'Paste Chinese text here (min 50 characters)…'}
        placeholderTextColor="#64748b"
        value={source}
        onChangeText={setSource}
        autoCapitalize="none"
        autoCorrect={false}
        multiline={type === 'text'}
        keyboardType={type === 'url' ? 'url' : 'default'}
      />

      <TouchableOpacity
        style={[styles.primaryButton, !source.trim() && styles.disabled]}
        onPress={handleExtract}
        disabled={!source.trim()}
      >
        <Text style={styles.primaryButtonText}>Extract Vocabulary</Text>
      </TouchableOpacity>

      <Text style={styles.hint}>Limit: 10 imports per hour</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#94a3b8', marginTop: 16, fontSize: 15 },
  subtitle: { color: '#94a3b8', fontSize: 14, lineHeight: 20, marginBottom: 16 },
  sourceTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 4 },
  segmentRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  segment: {
    flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#334155',
  },
  segmentActive: { borderColor: '#a855f7', backgroundColor: '#9333ea22' },
  segmentText: { color: '#e2e8f0', textAlign: 'center', fontWeight: '600', fontSize: 14 },
  input: {
    backgroundColor: '#1e293b', borderRadius: 12, padding: 14, color: '#fff',
    borderWidth: 1, borderColor: '#334155', marginBottom: 16,
  },
  textArea: { minHeight: 160, textAlignVertical: 'top' },
  primaryButton: { backgroundColor: '#9333ea', borderRadius: 12, padding: 16 },
  primaryButtonText: { color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 16 },
  secondaryButton: { padding: 14, marginTop: 4 },
  secondaryButtonText: { color: '#94a3b8', textAlign: 'center', fontWeight: '600' },
  disabled: { opacity: 0.5 },
  hint: { color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 12 },
  wordCard: {
    backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#334155',
  },
  wordCardSelected: { borderColor: '#a855f7' },
  wordZh: { color: '#fff', fontSize: 18, fontWeight: '600' },
  wordPinyin: { color: '#a855f7', fontSize: 13, marginTop: 1 },
  wordEn: { color: '#94a3b8', fontSize: 13, marginTop: 1 },
  checkmark: { fontSize: 22, color: '#a855f7' },
});
