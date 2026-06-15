import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../src/lib/auth-context';
import { LoginRequiredPrompt } from '../src/components/login-required-prompt';
import { PracticeStatusView } from '../src/components/practice-status-view';
import { AppHeader } from '../src/components/app-header';
import { HandwritingCanvas, HandwritingCanvasHandle } from '../src/components/handwriting-canvas';
import { speakChinese } from '../src/lib/tts-speech-service';
import {
  loadQuizPool, traceableWords, splitCharacters, recordHandwritingAttempt,
  MIN_WORDS_FOR_HANDWRITING,
} from '../src/lib/handwriting-service';
import type { VocabularyItem } from '../src/lib/vocabulary-service';
import { useTheme } from '../src/theme/theme-context';
import { spacing, radius, typography, fonts } from '../src/theme/theme';

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
  const canvasRef = useRef<HandwritingCanvasHandle>(null);

  const [phase, setPhase] = useState<Phase>('loading');
  const [words, setWords] = useState<VocabularyItem[]>([]);
  const [wordIndex, setWordIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0);
  const [results, setResults] = useState({ correct: 0, again: 0 });
  // Tracks whether every character in the current word was self-rated "Got it".
  const wordSuccess = useRef(true);

  const start = useCallback(async () => {
    setPhase('loading');
    setWordIndex(0); setCharIndex(0); setRevealed(false); setStrokeCount(0);
    setResults({ correct: 0, again: 0 });
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
    return <LoginRequiredPrompt message="Log in to practice writing characters by hand." />;
  }

  const resetCanvas = () => { canvasRef.current?.clear(); setStrokeCount(0); setRevealed(false); };

  const word = words[wordIndex];
  const chars = word ? splitCharacters(word.wordZh) : [];
  const currentChar = chars[charIndex];

  // Move to the next character, or finish the word and record the attempt.
  const advance = (gotIt: boolean) => {
    if (!gotIt) wordSuccess.current = false;

    const isLastChar = charIndex + 1 >= chars.length;
    if (!isLastChar) {
      setCharIndex((c) => c + 1);
      resetCanvas();
      return;
    }

    // Word complete — record one attempt for the whole word
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

  const withHeader = (child: React.ReactNode) => (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title="Handwriting" showBack />
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
      <PracticeStatusView icon="error-outline" title="Couldn't load words" subtitle="Please try again." actionLabel="Retry" onAction={start} />
    );
  }

  if (phase === 'tooFew') {
    return withHeader(
      <PracticeStatusView icon="draw" title="No words to write yet" subtitle="Save some Chinese words first, then come back to practice writing them by hand." />
    );
  }

  if (phase === 'done') {
    const total = results.correct + results.again;
    return withHeader(
      <PracticeStatusView
        icon="brush"
        title="Writing session complete!"
        subtitle={`${results.correct} of ${total} words marked confident`}
        actionLabel="Practice More"
        onAction={start}
      />
    );
  }

  // ---- practicing ----
  const multiChar = chars.length > 1;

  return withHeader(
    <View style={{ flex: 1, padding: spacing.containerMargin }}>
      {/* Progress */}
      <View style={styles.progressRow}>
        <Text style={[typography.label, { fontSize: 13, color: colors.onSurfaceVariant }]}>
          Word {wordIndex + 1} / {words.length}
        </Text>
        {multiChar && (
          <Text style={[typography.label, { fontSize: 13, color: colors.outline }]}>
            Character {charIndex + 1} / {chars.length}
          </Text>
        )}
      </View>

      {/* Prompt: meaning + pinyin (pinyin hidden until revealed to make it a real test) */}
      <View style={styles.prompt}>
        <Text style={[typography.heading, { color: colors.onSurface, textAlign: 'center' }]}>{word.wordEn}</Text>
        {revealed ? (
          <Pressable onPress={() => speakChinese(currentChar)} style={styles.pinyinRow}>
            <Text style={[typography.pinyin, { color: colors.primary, fontSize: 16 }]}>{word.wordPinyin}</Text>
            <MaterialIcons name="volume-up" size={18} color={colors.primary} />
          </Pressable>
        ) : (
          <Text style={[typography.pinyin, { color: colors.outline, marginTop: 4 }]}>Write the character for this meaning</Text>
        )}
      </View>

      {/* Canvas */}
      <HandwritingCanvas
        ref={canvasRef}
        guide={currentChar}
        revealed={revealed}
        onStrokesChange={setStrokeCount}
      />

      {/* Tool row */}
      <View style={styles.toolRow}>
        <Pressable style={styles.tool} onPress={() => canvasRef.current?.undo()} disabled={strokeCount === 0}>
          <MaterialIcons name="undo" size={20} color={strokeCount === 0 ? colors.outlineVariant : colors.onSurfaceVariant} />
          <Text style={[typography.label, { fontSize: 12, color: strokeCount === 0 ? colors.outlineVariant : colors.onSurfaceVariant }]}>Undo</Text>
        </Pressable>
        <Pressable style={styles.tool} onPress={resetCanvas} disabled={strokeCount === 0}>
          <MaterialIcons name="refresh" size={20} color={strokeCount === 0 ? colors.outlineVariant : colors.onSurfaceVariant} />
          <Text style={[typography.label, { fontSize: 12, color: strokeCount === 0 ? colors.outlineVariant : colors.onSurfaceVariant }]}>Clear</Text>
        </Pressable>
      </View>

      {/* Action area */}
      <View style={styles.actions}>
        {!revealed ? (
          <Pressable
            style={[styles.primaryBtn, { backgroundColor: colors.primaryContainer }]}
            onPress={() => setRevealed(true)}
          >
            <Text style={[typography.label, { fontSize: 15, color: colors.onPrimaryContainer }]}>
              {strokeCount === 0 ? 'Show Character' : 'Check My Writing'}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.rateRow}>
            <Pressable style={[styles.rateBtn, { borderColor: colors.error }]} onPress={() => advance(false)}>
              <MaterialIcons name="replay" size={18} color={colors.error} />
              <Text style={[typography.label, { fontSize: 14, color: colors.error }]}>Practice again</Text>
            </Pressable>
            <Pressable style={[styles.rateBtn, { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer }]} onPress={() => advance(true)}>
              <MaterialIcons name="check" size={18} color={colors.onPrimaryContainer} />
              <Text style={[typography.label, { fontSize: 14, color: colors.onPrimaryContainer }]}>Got it</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  prompt: { alignItems: 'center', marginBottom: spacing.md, minHeight: 56, justifyContent: 'center' },
  pinyinRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  toolRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xl, marginTop: spacing.md },
  tool: { alignItems: 'center', gap: 2, paddingHorizontal: spacing.md },
  actions: { marginTop: 'auto', paddingTop: spacing.md },
  primaryBtn: { borderRadius: radius.pill, paddingVertical: 16, alignItems: 'center' },
  rateRow: { flexDirection: 'row', gap: spacing.md },
  rateBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: radius.pill, paddingVertical: 16, borderWidth: 1.5,
  },
});
