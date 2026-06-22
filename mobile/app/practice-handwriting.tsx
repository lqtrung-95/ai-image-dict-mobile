import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../src/lib/auth-context';
import { LoginRequiredPrompt } from '../src/components/login-required-prompt';
import { PracticeStatusView } from '../src/components/practice-status-view';
import { AppHeader } from '../src/components/app-header';
import {
  HandwritingStrokeOrderCanvas,
  HandwritingStrokeOrderCanvasHandle,
} from '../src/components/handwriting-stroke-order-canvas';
import { speakChinese } from '../src/lib/tts-speech-service';
import {
  loadQuizPool, traceableWords, splitCharacters, recordHandwritingAttempt,
  MIN_WORDS_FOR_HANDWRITING,
} from '../src/lib/handwriting-service';
import type { VocabularyItem } from '../src/lib/vocabulary-service';
import { useTheme } from '../src/theme/theme-context';
import { useLocale } from '../src/lib/locale-react-context';
import { spacing, radius, typography } from '../src/theme/theme';

type Phase = 'loading' | 'tooFew' | 'error' | 'practicing' | 'done';

const SESSION_SIZE = 8;

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function HandwritingScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { t } = useLocale();
  const canvasRef = useRef<HandwritingStrokeOrderCanvasHandle>(null);

  const [phase, setPhase] = useState<Phase>('loading');
  const [words, setWords] = useState<VocabularyItem[]>([]);
  const [wordIndex, setWordIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0);
  const [results, setResults] = useState({ correct: 0, again: 0 });
  const [showGuide, setShowGuide] = useState(false);
  // Last stroke feedback message (e.g. "Wrong stroke order!")
  const [strokeHint, setStrokeHint] = useState<string | null>(null);
  // Whether the current character has been completed via correct stroke order
  const [charDone, setCharDone] = useState(false);
  const wordSuccess = useRef(true);

  const start = useCallback(async () => {
    setPhase('loading');
    setWordIndex(0); setCharIndex(0); setRevealed(false); setStrokeCount(0);
    setResults({ correct: 0, again: 0 });
    setCharDone(false);
    setStrokeHint(null);
    wordSuccess.current = true;
    try {
      const pool = traceableWords(await loadQuizPool());
      if (pool.length < MIN_WORDS_FOR_HANDWRITING) { setPhase('tooFew'); return; }
      setWords(shuffle(pool).slice(0, SESSION_SIZE));
      setPhase('practicing');
    } catch {
      setPhase('error');
    }
  }, []);

  useEffect(() => { if (user) start(); }, [user, start]);

  if (!user) {
    return <LoginRequiredPrompt message={t('handwriting.loginPrompt')} />;
  }

  const resetCanvas = () => {
    canvasRef.current?.clear();
    setStrokeCount(0);
    setRevealed(false);
    setCharDone(false);
    setStrokeHint(null);
  };

  const word = words[wordIndex];
  const chars = word ? splitCharacters(word.wordZh) : [];
  const currentChar = chars[charIndex];
  const multiChar = chars.length > 1;

  const advance = (gotIt: boolean) => {
    if (!gotIt) wordSuccess.current = false;

    const isLastChar = charIndex + 1 >= chars.length;
    if (!isLastChar) {
      setCharIndex((c) => c + 1);
      resetCanvas();
      return;
    }

    const success = wordSuccess.current;
    recordHandwritingAttempt(word.id, success);
    setResults((r) => ({ correct: r.correct + (success ? 1 : 0), again: r.again + (success ? 0 : 1) }));

    const isLastWord = wordIndex + 1 >= words.length;
    if (isLastWord) {
      setPhase('done');
    } else {
      setWordIndex((w) => w + 1);
      setCharIndex(0);
      wordSuccess.current = true;
      resetCanvas();
    }
  };

  // Called by canvas when all strokes for the character are drawn correctly
  const handleCharacterComplete = () => {
    setCharDone(true);
    setStrokeHint(null);
    speakChinese(currentChar);
  };

  const handleStrokeResult = (
    result: 'correct' | 'wrong' | null,
    correctSoFar: number,
    total: number
  ) => {
    if (result === 'wrong') {
      setStrokeHint(t('handwriting.wrongStrokeOrder'));
    } else if (result === 'correct') {
      setStrokeHint(correctSoFar < total ? `${correctSoFar} / ${total}` : null);
    }
  };

  const withHeader = (child: React.ReactNode) => (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title={t('handwriting.title')} showBack />
      {child}
    </View>
  );

  if (phase === 'loading') {
    return withHeader(
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  if (phase === 'error') {
    return withHeader(
      <PracticeStatusView icon="error-outline" title={t('handwriting.errorTitle')} subtitle={t('handwriting.errorSub')} actionLabel={t('handwriting.retry')} onAction={start} />
    );
  }
  if (phase === 'tooFew') {
    return withHeader(
      <PracticeStatusView icon="draw" title={t('handwriting.noWordsTitle')} subtitle={t('handwriting.noWordsSub')} />
    );
  }
  if (phase === 'done') {
    const total = results.correct + results.again;
    return withHeader(
      <PracticeStatusView
        icon="brush"
        title={t('handwriting.sessionDone')}
        subtitle={t('flashcards.sessionResult', { correct: results.correct, total })}
        actionLabel={t('handwriting.practiceMore')}
        onAction={start}
      />
    );
  }

  return withHeader(
    <View style={{ flex: 1, padding: spacing.containerMargin }}>
      {/* Progress */}
      <View style={styles.progressRow}>
        <Text style={[typography.label, { fontSize: 13, color: colors.onSurfaceVariant }]}>
          {t('handwriting.wordProgress', { current: wordIndex + 1, total: words.length })}
        </Text>
        {multiChar && (
          <Text style={[typography.label, { fontSize: 13, color: colors.outline }]}>
            {t('handwriting.charProgress', { current: charIndex + 1, total: chars.length })}
          </Text>
        )}
      </View>

      {/* Prompt */}
      <View style={styles.prompt}>
        <Text style={[typography.heading, { color: colors.onSurface, textAlign: 'center' }]}>{word.wordEn}</Text>
        {revealed || charDone ? (
          <Pressable onPress={() => speakChinese(currentChar)} style={styles.pinyinRow}>
            <Text style={[typography.pinyin, { color: colors.primary, fontSize: 16 }]}>{word.wordPinyin}</Text>
            <MaterialIcons name="volume-up" size={18} color={colors.primary} />
          </Pressable>
        ) : (
          <Text style={[typography.pinyin, { color: colors.outline, marginTop: 4 }]}>{t('handwriting.writePrompt')}</Text>
        )}
      </View>

      {/* Canvas */}
      <HandwritingStrokeOrderCanvas
        ref={canvasRef}
        guide={currentChar}
        revealed={revealed || charDone}
        showGuide={showGuide}
        onStrokesChange={setStrokeCount}
        onStrokeResult={handleStrokeResult}
        onCharacterComplete={handleCharacterComplete}
      />

      {/* Stroke hint below canvas */}
      <Text style={[styles.strokeHint, { color: strokeHint ? colors.error : 'transparent' }]}>
        {strokeHint ?? '.'}
      </Text>

      {/* Tool row */}
      <View style={styles.toolRow}>
        <Pressable style={styles.tool} onPress={() => canvasRef.current?.undo()} disabled={strokeCount === 0}>
          <MaterialIcons name="undo" size={20} color={strokeCount === 0 ? colors.outlineVariant : colors.onSurfaceVariant} />
          <Text style={[typography.label, { fontSize: 12, color: strokeCount === 0 ? colors.outlineVariant : colors.onSurfaceVariant }]}>{t('handwriting.undo')}</Text>
        </Pressable>
        <Pressable style={styles.tool} onPress={resetCanvas} disabled={strokeCount === 0}>
          <MaterialIcons name="refresh" size={20} color={strokeCount === 0 ? colors.outlineVariant : colors.onSurfaceVariant} />
          <Text style={[typography.label, { fontSize: 12, color: strokeCount === 0 ? colors.outlineVariant : colors.onSurfaceVariant }]}>{t('handwriting.clear')}</Text>
        </Pressable>
        {/* Guide toggle */}
        <Pressable
          style={[styles.tool, showGuide && { backgroundColor: colors.primaryContainer, borderRadius: radius.sm }]}
          onPress={() => setShowGuide((v) => !v)}
        >
          <MaterialIcons
            name="auto-fix-high"
            size={20}
            color={showGuide ? colors.onPrimaryContainer : colors.onSurfaceVariant}
          />
          <Text style={[typography.label, { fontSize: 12, color: showGuide ? colors.onPrimaryContainer : colors.onSurfaceVariant }]}>
            {t('handwriting.guide')}
          </Text>
        </Pressable>
      </View>

      {/* Action area — sits directly below toolbar, no auto-margin */}
      <View style={styles.actions}>
        {charDone ? (
          <View style={styles.rateRow}>
            <Pressable style={[styles.rateBtn, { borderColor: colors.error }]} onPress={() => advance(false)}>
              <MaterialIcons name="replay" size={18} color={colors.error} />
              <Text style={[typography.label, { fontSize: 14, color: colors.error }]}>{t('handwriting.practiceAgain')}</Text>
            </Pressable>
            <Pressable style={[styles.rateBtn, { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer }]} onPress={() => advance(true)}>
              <MaterialIcons name="check" size={18} color={colors.onPrimaryContainer} />
              <Text style={[typography.label, { fontSize: 14, color: colors.onPrimaryContainer }]}>{t('handwriting.gotIt')}</Text>
            </Pressable>
          </View>
        ) : !revealed ? (
          <Pressable
            style={[styles.primaryBtn, { backgroundColor: colors.primaryContainer }]}
            onPress={() => setRevealed(true)}
          >
            <Text style={[typography.label, { fontSize: 15, color: colors.onPrimaryContainer }]}>
              {strokeCount === 0 ? t('handwriting.showCharacter') : t('handwriting.checkWriting')}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.rateRow}>
            <Pressable style={[styles.rateBtn, { borderColor: colors.error }]} onPress={() => advance(false)}>
              <MaterialIcons name="replay" size={18} color={colors.error} />
              <Text style={[typography.label, { fontSize: 14, color: colors.error }]}>{t('handwriting.practiceAgain')}</Text>
            </Pressable>
            <Pressable style={[styles.rateBtn, { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer }]} onPress={() => advance(true)}>
              <MaterialIcons name="check" size={18} color={colors.onPrimaryContainer} />
              <Text style={[typography.label, { fontSize: 14, color: colors.onPrimaryContainer }]}>{t('handwriting.gotIt')}</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  prompt: { alignItems: 'center', marginBottom: spacing.sm, minHeight: 56, justifyContent: 'center' },
  pinyinRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  strokeHint: { textAlign: 'center', fontSize: 13, marginBottom: spacing.xs, fontWeight: '500' },
  toolRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xl, marginTop: spacing.md },
  tool: { alignItems: 'center', gap: 2, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  actions: { paddingTop: spacing.md },
  primaryBtn: { borderRadius: radius.pill, paddingVertical: 16, alignItems: 'center' },
  rateRow: { flexDirection: 'row', gap: spacing.md },
  rateBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: radius.pill, paddingVertical: 16, borderWidth: 1.5,
  },
});
