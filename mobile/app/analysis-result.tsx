import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { speakChinese } from '../src/lib/tts-speech-service';
import { useAuth } from '../src/lib/auth-context';
import { getLatestAnalysisResult } from '../src/lib/analysis-result-store';
import { saveWordToVocabulary, DetectedWord } from '../src/lib/analysis-service';
import { ListPickerRow } from '../src/components/list-picker-row';
import { useTheme } from '../src/theme/theme-context';
import { spacing, radius, typography, fonts, makeShadow } from '../src/theme/theme';
import { Icon, Eyebrow } from '../src/theme/ui-primitives';

const CATEGORY_LABELS: Record<string, string> = {
  object: 'Objects', color: 'Colors', action: 'Actions',
};

function WordCard({ word, canSave, listId }: { word: DetectedWord; canSave: boolean; listId: string | null }) {
  const { colors } = useTheme();
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
    <View style={[styles.wordCard, { backgroundColor: colors.surface, borderColor: colors.surfaceContainerHigh, ...makeShadow(colors, 'card') }]}>
      {/* Rice-grid character box */}
      <View style={[styles.charBox, { backgroundColor: colors.surfaceContainer, borderColor: colors.outlineVariant }]}>
        <View style={[styles.gridV, { backgroundColor: colors.outlineVariant }]} />
        <View style={[styles.gridH, { backgroundColor: colors.outlineVariant }]} />
        <Text style={[styles.charZh, { color: colors.primary }]} numberOfLines={1} adjustsFontSizeToFit>
          {word.zh}
        </Text>
      </View>

      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text style={[typography.pinyin, { color: colors.onSurfaceVariant }]}>{word.pinyin}</Text>
        <Text style={{ fontFamily: fonts.headlineSemi, fontSize: 16, color: colors.onSurface, marginTop: 2 }}>{word.en}</Text>
        {word.hskLevel != null && (
          <View style={[styles.hskChip, { backgroundColor: colors.primarySoft }]}>
            <Text style={[typography.label, { color: colors.primary }]}>HSK {word.hskLevel}</Text>
          </View>
        )}
      </View>

      <View style={{ gap: spacing.xs }}>
        <Pressable
          style={[styles.iconBtn, { backgroundColor: colors.surfaceContainer }]}
          onPress={() => speakChinese(word.zh)}
        >
          <Icon name="volume-up" size={20} color={colors.primary} />
        </Pressable>
        {canSave && (
          <Pressable
            style={[styles.iconBtn, { backgroundColor: saved ? colors.primaryContainer : colors.surfaceContainer }]}
            onPress={handleSave}
            disabled={saved || saving}
          >
            <Icon name={saved ? 'bookmark-added' : 'bookmark-add'} size={20} color={saved ? colors.onPrimaryContainer : colors.primary} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function AnalysisResultScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const result = getLatestAnalysisResult();
  const [targetListId, setTargetListId] = useState<string | null>(null);

  if (!result) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[typography.body, { color: colors.onSurfaceVariant }]}>No analysis to show.</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={[typography.label, { color: colors.primary, fontSize: 14, marginTop: spacing.sm }]}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const byCategory = (['object', 'color', 'action'] as const)
    .map((cat) => ({ cat, words: result.words.filter((w) => w.category === cat) }))
    .filter((g) => g.words.length > 0);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
      {/* Hero image with overlay pills */}
      <View style={styles.hero}>
        <Image source={{ uri: result.imageUri }} style={styles.heroImage} />
        <Pressable style={[styles.backBtn, { top: insets.top + 8, backgroundColor: colors.surface }]} onPress={() => router.back()}>
          <Icon name="arrow-back" size={22} color={colors.onSurface} />
        </Pressable>
        <View style={[styles.overlayRow, { top: insets.top + 8 }]}>
          <View style={[styles.pill, { backgroundColor: 'rgba(255,255,255,0.85)' }]}>
            <Icon name="visibility" size={16} color={colors.primary} />
            <Text style={[typography.label, { color: '#191c1d' }]}>{result.words.length} detected</Text>
          </View>
          {result.usage && (
            <View style={[styles.pill, { backgroundColor: colors.primaryContainer }]}>
              <Icon name="analytics" size={16} color={colors.onPrimaryContainer} />
              <Text style={[typography.label, { color: colors.onPrimaryContainer }]}>
                {result.usage.remaining}/{result.usage.limit} left
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Pulled-up results sheet */}
      <View style={[styles.sheet, { backgroundColor: colors.background }]}>
        <View style={[styles.handle, { backgroundColor: colors.surfaceHighest }]} />

        {result.sceneDescriptionZh ? (
          <Pressable style={[styles.sceneCard, { backgroundColor: colors.surface, ...makeShadow(colors, 'card') }]} onPress={() => speakChinese(result.sceneDescriptionZh!)}>
            <Text style={{ fontFamily: fonts.hanzi, fontSize: 20, color: colors.onSurface }}>{result.sceneDescriptionZh}</Text>
            {result.sceneDescriptionPinyin ? (
              <Text style={[typography.pinyin, { color: colors.primary, marginTop: 4 }]}>{result.sceneDescriptionPinyin}</Text>
            ) : null}
            <Text style={[typography.body, { color: colors.onSurfaceVariant, marginTop: 4 }]}>{result.sceneDescription}</Text>
          </Pressable>
        ) : null}

        <Text style={[typography.headline, { color: colors.onSurface, marginVertical: spacing.md }]}>Analysis Results</Text>

        {!user && (
          <Pressable style={[styles.loginBanner, { backgroundColor: colors.primarySoft, borderColor: colors.primaryFixed }]} onPress={() => router.push('/(auth)/login')}>
            <Icon name="lock" size={18} color={colors.primary} />
            <Text style={[typography.body, { color: colors.primary, flex: 1 }]}>Log in to save these words</Text>
          </Pressable>
        )}

        {user && (
          <View style={{ marginBottom: spacing.md }}>
            <ListPickerRow selectedListId={targetListId} onSelect={setTargetListId} />
          </View>
        )}

        {byCategory.map(({ cat, words }) => (
          <View key={cat} style={{ marginBottom: spacing.lg }}>
            <Eyebrow style={{ marginBottom: spacing.sm }}>{CATEGORY_LABELS[cat]}</Eyebrow>
            <View style={{ gap: spacing.sm }}>
              {words.map((word) => (
                <WordCard key={word.id} word={word} canSave={!!user} listId={targetListId} />
              ))}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hero: { width: '100%', aspectRatio: 4 / 5, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  backBtn: { position: 'absolute', left: spacing.containerMargin, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  overlayRow: { position: 'absolute', right: spacing.containerMargin, flexDirection: 'row', gap: spacing.xs },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill },
  sheet: { marginTop: -28, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingHorizontal: spacing.containerMargin, paddingTop: spacing.md, minHeight: 400 },
  handle: { width: 48, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.lg },
  sceneCard: { borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  loginBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  wordCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, borderWidth: 1, borderRadius: radius.lg, padding: spacing.md },
  charBox: { width: 72, height: 72, borderRadius: radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  gridV: { position: 'absolute', width: 1, height: '100%', opacity: 0.4 },
  gridH: { position: 'absolute', height: 1, width: '100%', opacity: 0.4 },
  charZh: { fontFamily: fonts.hanzi, fontSize: 34, paddingHorizontal: 4 },
  hskChip: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2, marginTop: spacing.xs },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
