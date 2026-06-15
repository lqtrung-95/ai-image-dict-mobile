import { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { speakChinese } from '../src/lib/tts-speech-service';
import { ListPickerRow } from '../src/components/list-picker-row';
import {
  startImport, saveImportedWords, ImportSourceType, ExtractedWord, ImportPreview,
} from '../src/lib/import-service';
import { useTheme } from '../src/theme/theme-context';
import { spacing, radius, typography, fonts } from '../src/theme/theme';
import { Icon } from '../src/theme/ui-primitives';
import { AppHeader } from '../src/components/app-header';
import { showError, showSuccess } from '../src/lib/toast';

type Phase = 'input' | 'extracting' | 'preview' | 'saving';

export default function ImportVocabularyScreen() {
  const router = useRouter();
  const { colors } = useTheme();
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
      setSelected(new Set(result.preview.map((_, i) => i)));
      setPhase('preview');
    } catch (err) {
      showError('Extraction failed', err instanceof Error ? err.message : 'Try again');
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
      showSuccess('Imported!', `${saved} words added to your vocabulary.`);
      router.back();
    } catch (err) {
      showError('Save failed', err instanceof Error ? err.message : 'Try again');
      setPhase('preview');
    }
  };

  const primaryBtn = (disabled?: boolean) => [styles.primaryBtn, { backgroundColor: colors.primaryContainer }, disabled && { opacity: 0.5 }];
  const inputStyle = { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, color: colors.onSurface, borderWidth: 1, borderColor: colors.outlineVariant, marginBottom: spacing.md, fontFamily: fonts.body };

  if (phase === 'extracting' || phase === 'saving') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppHeader title="Import Words" showBack />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[typography.body, { color: colors.onSurfaceVariant, marginTop: spacing.md }]}>
            {phase === 'extracting' ? 'AI is extracting vocabulary…' : 'Saving words…'}
          </Text>
        </View>
      </View>
    );
  }

  if (phase === 'preview' && preview) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppHeader title="Import Words" showBack />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.containerMargin, paddingBottom: 48 }}>
        <Text style={[typography.heading, { color: colors.onSurface }]}>{preview.sourceTitle}</Text>
        <Text style={[typography.pinyin, { color: colors.onSurfaceVariant, marginBottom: spacing.md }]}>
          {preview.preview.length} words found · {selected.size} selected (tap to toggle)
        </Text>

        <View style={{ marginBottom: spacing.md }}>
          <ListPickerRow selectedListId={listId} onSelect={setListId} />
        </View>

        {preview.preview.map((w, i) => {
          const isSel = selected.has(i);
          return (
            <Pressable
              key={`${w.zh}-${i}`}
              style={[styles.wordCard, { backgroundColor: colors.surface, borderColor: isSel ? colors.primary : colors.outlineVariant }]}
              onPress={() => toggleWord(i)}
              onLongPress={() => speakChinese(w.zh)}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.hanzi, fontSize: 18, color: colors.onSurface }}>{w.zh}</Text>
                <Text style={[typography.pinyin, { color: colors.primary, marginTop: 1 }]}>{w.pinyin}</Text>
                <Text style={[typography.pinyin, { color: colors.onSurfaceVariant, marginTop: 1 }]}>{w.en}</Text>
              </View>
              <Icon name={isSel ? 'check-box' : 'check-box-outline-blank'} size={24} color={isSel ? colors.primary : colors.outline} />
            </Pressable>
          );
        })}

        <Pressable style={primaryBtn(selected.size === 0)} onPress={handleSave} disabled={selected.size === 0}>
          <Text style={[typography.label, { fontSize: 15, color: colors.onPrimaryContainer }]}>Save {selected.size} words</Text>
        </Pressable>
        <Pressable style={{ padding: spacing.md, marginTop: 4 }} onPress={() => setPhase('input')}>
          <Text style={[typography.label, { fontSize: 14, color: colors.onSurfaceVariant, textAlign: 'center' }]}>Start over</Text>
        </Pressable>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title="Import Words" showBack />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.containerMargin }}>
      <Text style={[typography.body, { color: colors.onSurfaceVariant, marginBottom: spacing.md }]}>
        Import Chinese vocabulary from a web article or pasted text. AI extracts the words for you.
      </Text>

      <View style={styles.segmentRow}>
        {(['url', 'text'] as ImportSourceType[]).map((t) => (
          <Pressable
            key={t}
            style={[styles.segment, { backgroundColor: type === t ? colors.primarySoft : colors.surface, borderColor: type === t ? colors.primary : colors.outlineVariant }]}
            onPress={() => setType(t)}
          >
            <Text style={[typography.label, { fontSize: 14, color: colors.onSurface }]}>{t === 'url' ? 'From URL' : 'Paste Text'}</Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        style={[inputStyle, type === 'text' && { minHeight: 160, textAlignVertical: 'top' }]}
        placeholder={type === 'url' ? 'https://example.com/chinese-article' : 'Paste Chinese text here (min 50 characters)…'}
        placeholderTextColor={colors.outline}
        value={source}
        onChangeText={setSource}
        autoCapitalize="none"
        autoCorrect={false}
        multiline={type === 'text'}
        keyboardType={type === 'url' ? 'url' : 'default'}
      />

      <Pressable style={primaryBtn(!source.trim())} onPress={handleExtract} disabled={!source.trim()}>
        <Text style={[typography.label, { fontSize: 15, color: colors.onPrimaryContainer }]}>Extract Vocabulary</Text>
      </Pressable>

      <Text style={[typography.label, { fontSize: 12, color: colors.outline, textAlign: 'center', marginTop: spacing.md }]}>Limit: 10 imports per hour</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  segmentRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  segment: { flex: 1, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, alignItems: 'center' },
  primaryBtn: { borderRadius: radius.pill, padding: spacing.md, alignItems: 'center' },
  wordCard: { borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.xs, flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
});
