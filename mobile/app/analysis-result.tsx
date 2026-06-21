import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { speakChinese } from '../src/lib/tts-speech-service';
import { useAuth } from '../src/lib/auth-context';
import { getLatestAnalysisResult } from '../src/lib/analysis-result-store';
import { saveWordToVocabulary, DetectedWord } from '../src/lib/analysis-service';
import { fetchLists, VocabularyList } from '../src/lib/library-service';
import { SaveToListSheet } from '../src/components/save-to-list-sheet';
import { showError } from '../src/lib/toast';
import { useTheme } from '../src/theme/theme-context';
import { useLocale } from '../src/lib/locale-react-context';
import { spacing, radius, typography, fonts, makeShadow } from '../src/theme/theme';
import { Icon, Eyebrow } from '../src/theme/ui-primitives';

function WordCard({
  word, canSave, saved, saving, onSavePress,
}: {
  word: DetectedWord;
  canSave: boolean;
  saved: boolean;
  saving: boolean;
  onSavePress: (word: DetectedWord) => void;
}) {
  const { colors } = useTheme();
  const { t } = useLocale();

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
            onPress={() => onSavePress(word)}
            disabled={saved || saving}
          >
            {saving
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Icon name={saved ? 'bookmark-added' : 'bookmark-add'} size={20} color={saved ? colors.onPrimaryContainer : colors.primary} />}
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
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const result = getLatestAnalysisResult();
  const [lists, setLists] = useState<VocabularyList[]>([]);
  const [pickerWord, setPickerWord] = useState<DetectedWord | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);

  // Preload the user's lists once so the save sheet opens instantly.
  useEffect(() => {
    if (user) fetchLists().then(setLists).catch(() => {});
  }, [user]);

  // User picked a destination in the sheet — persist the pending word there.
  const handleChooseList = async (listId: string | null) => {
    const word = pickerWord;
    setPickerWord(null);
    if (!word) return;
    setSavingId(word.id);
    try {
      await saveWordToVocabulary(word, listId ?? undefined);
      setSavedIds((prev) => new Set(prev).add(word.id));
    } catch (err) {
      showError('Save failed', err instanceof Error ? err.message : 'Try again');
    } finally {
      setSavingId(null);
    }
  };

  if (!result) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[typography.body, { color: colors.onSurfaceVariant }]}>{t('analysis.noResult')}</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={[typography.label, { color: colors.primary, fontSize: 14, marginTop: spacing.sm }]}>{t('analysis.goBack')}</Text>
        </Pressable>
      </View>
    );
  }

  const byCategory = (['object', 'color', 'action'] as const)
    .map((cat) => ({ cat, words: result.words.filter((w) => w.category === cat) }))
    .filter((g) => g.words.length > 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 48 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero image with overlay pills */}
      <View style={styles.hero}>
        <Image source={{ uri: result.imageUri }} style={styles.heroImage} />
        <Pressable style={[styles.backBtn, { top: insets.top + 8, backgroundColor: colors.surface }]} onPress={() => router.back()}>
          <Icon name="arrow-back" size={22} color={colors.onSurface} />
        </Pressable>
        <View style={[styles.overlayRow, { top: insets.top + 8 }]}>
          <View style={[styles.pill, { backgroundColor: 'rgba(255,255,255,0.85)' }]}>
            <Icon name="visibility" size={16} color={colors.primary} />
            <Text style={[typography.label, { color: '#191c1d' }]}>{t('analysis.detected', { count: result.words.length })}</Text>
          </View>
          {result.usage && (
            <View style={[styles.pill, { backgroundColor: colors.primaryContainer }]}>
              <Icon name="analytics" size={16} color={colors.onPrimaryContainer} />
              <Text style={[typography.label, { color: colors.onPrimaryContainer }]}>
                {t('analysis.remaining', { remaining: result.usage.remaining, limit: result.usage.limit })}
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

        <Text style={[typography.headline, { color: colors.onSurface, marginVertical: spacing.md }]}>{t('analysis.title')}</Text>

        {!user && (
          <Pressable style={[styles.loginBanner, { backgroundColor: colors.primarySoft, borderColor: colors.primaryFixed }]} onPress={() => router.push('/(auth)/login')}>
            <Icon name="lock" size={18} color={colors.primary} />
            <Text style={[typography.body, { color: colors.primary, flex: 1 }]}>{t('analysis.loginToSave')}</Text>
          </Pressable>
        )}

        {byCategory.map(({ cat, words }) => (
          <View key={cat} style={{ marginBottom: spacing.lg }}>
            <Eyebrow style={{ marginBottom: spacing.sm }}>{cat === 'object' ? t('analysis.categoryObjects') : cat === 'color' ? t('analysis.categoryColors') : t('analysis.categoryActions')}</Eyebrow>
            <View style={{ gap: spacing.sm }}>
              {words.map((word) => (
                <WordCard
                  key={word.id}
                  word={word}
                  canSave={!!user}
                  saved={savedIds.has(word.id)}
                  saving={savingId === word.id}
                  onSavePress={setPickerWord}
                />
              ))}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>

    <SaveToListSheet
      visible={pickerWord !== null}
      wordZh={pickerWord?.zh}
      lists={lists}
      onChoose={handleChooseList}
      onCancel={() => setPickerWord(null)}
      onListCreated={(list) => setLists((prev) => [list, ...prev])}
    />
    </View>
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
