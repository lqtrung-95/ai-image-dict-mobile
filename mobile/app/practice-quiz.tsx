import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '../src/lib/auth-context';
import { LoginRequiredPrompt } from '../src/components/login-required-prompt';
import { PracticeStatusView } from '../src/components/practice-status-view';
import { AppHeader } from '../src/components/app-header';
import { speakChinese } from '../src/lib/tts-speech-service';
import { notifySuccess, notifyError } from '../src/lib/haptics-service';
import {
  QuizMode, QuizQuestion, loadQuizPool, buildChoiceQuestions, buildPinyinQuestions,
  isPinyinCorrect, recordQuizAnswer, MIN_WORDS_FOR_QUIZ,
} from '../src/lib/quiz-service';
import { useTheme } from '../src/theme/theme-context';
import { spacing, radius, typography, fonts, makeShadow } from '../src/theme/theme';
import { Icon, Card } from '../src/theme/ui-primitives';

type Phase = 'menu' | 'loading' | 'playing' | 'done' | 'tooFew' | 'error';
type IconName = React.ComponentProps<typeof Icon>['name'];

const MODES: { mode: QuizMode; icon: IconName; title: string; desc: string }[] = [
  { mode: 'multiple-choice', icon: 'checklist', title: 'Multiple Choice', desc: 'Read the word, pick the meaning' },
  { mode: 'listening', icon: 'hearing', title: 'Listening', desc: 'Hear the word, pick the meaning' },
  { mode: 'pinyin', icon: 'keyboard', title: 'Type Pinyin', desc: 'See the word, type its pinyin' },
];

export default function QuizScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ mode?: string }>();
  const [phase, setPhase] = useState<Phase>('menu');
  const [mode, setMode] = useState<QuizMode>('multiple-choice');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [typed, setTyped] = useState('');
  const [revealed, setRevealed] = useState(false);
  const autoStarted = useRef(false);

  // Deep-link: when launched with ?mode=… from the Practice page, jump straight
  // into that quiz mode instead of showing the in-screen mode menu.
  useEffect(() => {
    if (autoStarted.current || !user) return;
    const m = params.mode;
    if (m === 'multiple-choice' || m === 'listening' || m === 'pinyin') {
      autoStarted.current = true;
      start(m);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.mode, user]);

  if (!user) {
    return <LoginRequiredPrompt message="Log in to take vocabulary quizzes." />;
  }

  const start = async (selectedMode: QuizMode) => {
    setMode(selectedMode);
    setPhase('loading');
    try {
      const pool = await loadQuizPool();
      if (pool.length < MIN_WORDS_FOR_QUIZ) { setPhase('tooFew'); return; }
      const built = selectedMode === 'pinyin' ? buildPinyinQuestions(pool) : buildChoiceQuestions(pool);
      setQuestions(built); setIndex(0); setScore(0); setSelected(null); setTyped(''); setRevealed(false);
      setPhase('playing');
      if (selectedMode === 'listening') setTimeout(() => speakChinese(built[0].word.wordZh), 400);
    } catch { setPhase('error'); }
  };

  const current = questions[index];

  const advance = (wasCorrect: boolean) => {
    if (wasCorrect) setScore((s) => s + 1);
    recordQuizAnswer(current.word.id, wasCorrect, mode);
    if (index + 1 >= questions.length) { setPhase('done'); }
    else {
      const next = index + 1;
      setIndex(next); setSelected(null); setTyped(''); setRevealed(false);
      if (mode === 'listening') setTimeout(() => speakChinese(questions[next].word.wordZh), 300);
    }
  };

  const handleChoice = (optionIndex: number) => {
    if (selected !== null) return;
    setSelected(optionIndex);
    const correct = optionIndex === current.correctIndex;
    correct ? notifySuccess() : notifyError();
    setTimeout(() => advance(correct), 900);
  };

  const handlePinyinSubmit = () => {
    if (revealed) return;
    setRevealed(true);
    const correct = isPinyinCorrect(typed, current.word.wordPinyin);
    correct ? notifySuccess() : notifyError();
    setTimeout(() => advance(correct), 1200);
  };

  if (phase === 'menu') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppHeader title="Quiz" showBack />
        <View style={{ flex: 1, padding: spacing.containerMargin, gap: spacing.md }}>
        <Text style={[typography.body, { color: colors.onSurfaceVariant }]}>Choose a quiz mode</Text>
        {MODES.map((m) => (
          <Card key={m.mode} onPress={() => start(m.mode)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View style={{ width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={m.icon} size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typography.heading, { color: colors.onSurface }]}>{m.title}</Text>
                <Text style={[typography.pinyin, { color: colors.outline, marginTop: 2 }]}>{m.desc}</Text>
              </View>
            </View>
          </Card>
        ))}
        </View>
      </View>
    );
  }

  if (phase === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppHeader title="Quiz" showBack />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={colors.primary} /></View>
      </View>
    );
  }
  if (phase === 'error') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppHeader title="Quiz" showBack />
        <PracticeStatusView icon="error-outline" title="Something went wrong" actionLabel="Back to modes" onAction={() => setPhase('menu')} />
      </View>
    );
  }
  if (phase === 'tooFew') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppHeader title="Quiz" showBack />
        <PracticeStatusView icon="menu-book" title="Need more words" subtitle={`Save at least ${MIN_WORDS_FOR_QUIZ} words to play quizzes. Capture more photos!`} actionLabel="Back" onAction={() => setPhase('menu')} />
      </View>
    );
  }
  if (phase === 'done') {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppHeader title="Quiz" showBack />
        <PracticeStatusView
          icon={pct >= 80 ? 'emoji-events' : pct >= 50 ? 'thumb-up' : 'fitness-center'}
          title={`${score} / ${questions.length}`}
          subtitle={`${pct}% correct`}
          actionLabel="Play Again"
          onAction={() => start(mode)}
          secondaryLabel="Change Mode"
          onSecondary={() => setPhase('menu')}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title="Quiz" showBack />
      <View style={{ flex: 1, padding: spacing.containerMargin }}>
      <Text style={[typography.label, { fontSize: 13, color: colors.onSurfaceVariant, textAlign: 'center' }]}>
        {index + 1} / {questions.length}  ·  Score {score}
      </Text>

      <View style={styles.prompt}>
        {mode === 'listening' ? (
          <Pressable style={{ alignItems: 'center' }} onPress={() => speakChinese(current.word.wordZh)}>
            <Icon name="volume-up" size={56} color={colors.primary} />
            <Text style={[typography.pinyin, { color: colors.outline, marginTop: spacing.sm }]}>Tap to replay</Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => speakChinese(current.word.wordZh)} style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily: fonts.hanzi, fontSize: 64, color: colors.onSurface }}>{current.word.wordZh}</Text>
            {mode === 'pinyin' && <Text style={[typography.pinyin, { color: colors.outline, marginTop: spacing.xs }]}>{current.word.wordEn}</Text>}
          </Pressable>
        )}
      </View>

      {mode === 'pinyin' ? (
        <View>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.onSurface, borderColor: colors.outlineVariant, fontFamily: fonts.body }]}
            placeholder="Type the pinyin…"
            placeholderTextColor={colors.outline}
            value={typed}
            onChangeText={setTyped}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!revealed}
            onSubmitEditing={handlePinyinSubmit}
          />
          {revealed ? (
            <Text style={[typography.heading, { textAlign: 'center', marginTop: spacing.md, color: isPinyinCorrect(typed, current.word.wordPinyin) ? colors.primary : colors.error }]}>
              {isPinyinCorrect(typed, current.word.wordPinyin) ? '✓ Correct!' : `✗ Answer: ${current.word.wordPinyin}`}
            </Text>
          ) : (
            <Pressable
              style={[styles.checkBtn, { backgroundColor: colors.primaryContainer }, !typed && { opacity: 0.5 }]}
              onPress={handlePinyinSubmit}
              disabled={!typed}
            >
              <Text style={[typography.label, { fontSize: 15, color: colors.onPrimaryContainer }]}>Check</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {current.options.map((opt, i) => {
            let bg = colors.surface;
            let border = colors.outlineVariant;
            if (selected !== null) {
              if (i === current.correctIndex) { bg = colors.primaryContainer; border = colors.primaryContainer; }
              else if (i === selected) { bg = colors.errorContainer; border = colors.error; }
            }
            const txt = selected !== null && (i === current.correctIndex) ? colors.onPrimaryContainer : colors.onSurface;
            return (
              <Pressable key={i} style={[styles.option, { backgroundColor: bg, borderColor: border }]} onPress={() => handleChoice(i)} disabled={selected !== null}>
                <Text style={[typography.body, { color: txt, textAlign: 'center' }]}>{opt}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  prompt: { alignItems: 'center', marginVertical: spacing.xl, minHeight: 120, justifyContent: 'center' },
  input: { borderRadius: radius.md, padding: spacing.md, fontSize: 18, textAlign: 'center', borderWidth: 1 },
  checkBtn: { borderRadius: radius.pill, paddingVertical: 14, alignItems: 'center', marginTop: spacing.md },
  option: { borderRadius: radius.md, padding: 18, borderWidth: 1 },
});
