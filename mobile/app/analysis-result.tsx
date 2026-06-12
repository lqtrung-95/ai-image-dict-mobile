import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { speakChinese } from '../src/lib/tts-speech-service';
import { useAuth } from '../src/lib/auth-context';
import { getLatestAnalysisResult } from '../src/lib/analysis-result-store';
import { saveWordToVocabulary, DetectedWord } from '../src/lib/analysis-service';
import { ListPickerRow } from '../src/components/list-picker-row';

const CATEGORY_LABELS: Record<string, string> = {
  object: '🧱 Objects',
  color: '🎨 Colors',
  action: '🏃 Actions',
};

const speak = speakChinese;

function WordCard({
  word, canSave, listId,
}: { word: DetectedWord; canSave: boolean; listId: string | null }) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveWordToVocabulary(word, listId ?? undefined);
      setSaved(true);
    } catch (err) {
      Alert.alert('Save failed', err instanceof Error ? err.message : 'Try again');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.wordCard}>
      <TouchableOpacity style={styles.wordMain} onPress={() => speak(word.zh)}>
        <View style={styles.wordHeader}>
          <Text style={styles.wordZh}>{word.zh}</Text>
          {word.hskLevel != null && (
            <View style={styles.hskBadge}>
              <Text style={styles.hskBadgeText}>HSK {word.hskLevel}</Text>
            </View>
          )}
          <Text style={styles.speakerIcon}>🔊</Text>
        </View>
        <Text style={styles.wordPinyin}>{word.pinyin}</Text>
        <Text style={styles.wordEn}>{word.en}</Text>
        {word.example && (
          <View style={styles.exampleBox}>
            <Text style={styles.exampleZh}>{word.example.zh}</Text>
            <Text style={styles.examplePinyin}>{word.example.pinyin}</Text>
            <Text style={styles.exampleEn}>{word.example.en}</Text>
          </View>
        )}
      </TouchableOpacity>
      {canSave && (
        <TouchableOpacity
          style={[styles.saveButton, saved && styles.savedButton]}
          onPress={handleSave}
          disabled={saved || saving}
        >
          <Text style={styles.saveButtonText}>
            {saved ? '✓ Saved' : saving ? 'Saving…' : '+ Save'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function AnalysisResultScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const result = getLatestAnalysisResult();
  const [targetListId, setTargetListId] = useState<string | null>(null);

  if (!result) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#94a3b8' }}>No analysis to show.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: '#a855f7', marginTop: 12 }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const byCategory = (['object', 'color', 'action'] as const)
    .map((cat) => ({ cat, words: result.words.filter((w) => w.category === cat) }))
    .filter((g) => g.words.length > 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 48 }}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>‹ Back</Text>
      </TouchableOpacity>

      <Image source={{ uri: result.imageUri }} style={styles.image} />

      <View style={styles.sceneBox}>
        {result.sceneDescriptionZh && (
          <TouchableOpacity onPress={() => speak(result.sceneDescriptionZh!)}>
            <Text style={styles.sceneZh}>{result.sceneDescriptionZh} 🔊</Text>
            {result.sceneDescriptionPinyin && (
              <Text style={styles.scenePinyin}>{result.sceneDescriptionPinyin}</Text>
            )}
          </TouchableOpacity>
        )}
        <Text style={styles.sceneEn}>{result.sceneDescription}</Text>
      </View>

      {result.usage && (
        <Text style={styles.usageText}>
          {result.usage.remaining} of {result.usage.limit} analyses left today
        </Text>
      )}

      {!user && (
        <TouchableOpacity
          style={styles.loginBanner}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.loginBannerText}>
            🔒 Log in to save these words to your vocabulary
          </Text>
        </TouchableOpacity>
      )}

      {user && (
        <View style={{ marginTop: 12 }}>
          <ListPickerRow selectedListId={targetListId} onSelect={setTargetListId} />
        </View>
      )}

      {byCategory.map(({ cat, words }) => (
        <View key={cat} style={styles.section}>
          <Text style={styles.sectionTitle}>{CATEGORY_LABELS[cat]}</Text>
          {words.map((word) => (
            <WordCard key={word.id} word={word} canSave={!!user} listId={targetListId} />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  backButton: { paddingVertical: 8, marginTop: 40 },
  backText: { color: '#a855f7', fontSize: 17 },
  image: { width: '100%', height: 220, borderRadius: 16, marginBottom: 16 },
  sceneBox: {
    backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 8,
  },
  sceneZh: { color: '#fff', fontSize: 18, fontWeight: '600', lineHeight: 26 },
  scenePinyin: { color: '#a855f7', fontSize: 14, marginTop: 4 },
  sceneEn: { color: '#94a3b8', fontSize: 14, marginTop: 8, lineHeight: 20 },
  usageText: { color: '#64748b', fontSize: 12, textAlign: 'center', marginBottom: 8 },
  loginBanner: {
    backgroundColor: '#9333ea22', borderColor: '#9333ea55', borderWidth: 1,
    borderRadius: 12, padding: 14, marginBottom: 8,
  },
  loginBannerText: { color: '#c4b5fd', textAlign: 'center', fontSize: 14 },
  section: { marginTop: 16 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 10 },
  wordCard: {
    backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 10,
    flexDirection: 'row', alignItems: 'flex-start',
  },
  wordMain: { flex: 1 },
  wordHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wordZh: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  speakerIcon: { fontSize: 14, marginLeft: 'auto' },
  hskBadge: {
    backgroundColor: '#9333ea33', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  hskBadgeText: { color: '#c4b5fd', fontSize: 11, fontWeight: '600' },
  wordPinyin: { color: '#a855f7', fontSize: 15, marginTop: 2 },
  wordEn: { color: '#94a3b8', fontSize: 14, marginTop: 2 },
  exampleBox: {
    backgroundColor: '#0f172a', borderRadius: 8, padding: 10, marginTop: 8,
  },
  exampleZh: { color: '#e2e8f0', fontSize: 14 },
  examplePinyin: { color: '#a855f7', fontSize: 12, marginTop: 2 },
  exampleEn: { color: '#64748b', fontSize: 12, marginTop: 2 },
  saveButton: {
    backgroundColor: '#9333ea', borderRadius: 8, paddingVertical: 8,
    paddingHorizontal: 12, marginLeft: 10,
  },
  savedButton: { backgroundColor: '#16a34a' },
  saveButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
