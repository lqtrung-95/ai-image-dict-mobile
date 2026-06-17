import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '../src/lib/auth-context';
import { usePremium } from '../src/lib/premium-context';
import { LoginRequiredPrompt } from '../src/components/login-required-prompt';
import { PracticeStatusView } from '../src/components/practice-status-view';
import { AppHeader } from '../src/components/app-header';
import { MatchingGame } from '../src/components/matching-game';
import {
  loadQuizPool, buildChoiceQuestions, QuizQuestion, recordQuizAnswer, MIN_WORDS_FOR_QUIZ,
} from '../src/lib/quiz-service';
import type { VocabularyItem } from '../src/lib/vocabulary-service';
import { useTheme } from '../src/theme/theme-context';
import { spacing, radius, typography, fonts } from '../src/theme/theme';
import { Icon, Card } from '../src/theme/ui-primitives';

type Game = 'menu' | 'loading' | 'tooFew' | 'matching' | 'rapid' | 'rapidDone';

const RAPID_SECONDS = 30;

export default function GamesScreen() {
  const { user } = useAuth();
  const { isPremiumUser } = usePremium();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ game?: string }>();
  const [game, setGame] = useState<Game>('menu');
  const [pool, setPool] = useState<VocabularyItem[]>([]);
  const autoStarted = useRef(false);

  // rapid-fire state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(RAPID_SECONDS);
  const [picked, setPicked] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  // Deep-link: when launched with ?game=… from the Practice page, jump straight
  // into that game instead of showing the in-screen game menu.
  useEffect(() => {
    if (autoStarted.current || !user) return;
    const g = params.game;
    if (g === 'matching' || g === 'rapid') {
      autoStarted.current = true;
      launch(g);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.game, user]);

  if (!user) {
    return <LoginRequiredPrompt message="Log in to play vocabulary games." />;
  }
  if (!isPremiumUser) {
    return <LoginRequiredPrompt message="Upgrade to Premium to unlock all mini games." actionLabel="View Premium" actionRoute="/premium" />;
  }

  const launch = async (target: 'matching' | 'rapid') => {
    setGame('loading');
    try {
      const loaded = await loadQuizPool();
      if (loaded.length < MIN_WORDS_FOR_QUIZ) {
        setGame('tooFew');
        return;
      }
      setPool(loaded);
      if (target === 'matching') {
        setGame('matching');
      } else {
        startRapid(loaded);
      }
    } catch {
      setGame('menu');
    }
  };

  const startRapid = (loaded: VocabularyItem[]) => {
    setQuestions(buildChoiceQuestions(loaded, 50));
    setQIndex(0);
    setScore(0);
    setPicked(null);
    setTimeLeft(RAPID_SECONDS);
    setGame('rapid');
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setGame('rapidDone');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const answerRapid = (optionIndex: number) => {
    if (picked !== null) return;
    setPicked(optionIndex);
    const q = questions[qIndex];
    const correct = optionIndex === q.correctIndex;
    if (correct) setScore((s) => s + 1);
    recordQuizAnswer(q.word.id, correct, 'multiple-choice');
    setTimeout(() => {
      setPicked(null);
      setQIndex((i) => (i + 1) % questions.length); // loop until timer ends
    }, 350);
  };

  // ---- render ----

  if (game === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppHeader title="Games" showBack />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={colors.primary} /></View>
      </View>
    );
  }

  if (game === 'tooFew') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppHeader title="Games" showBack />
        <PracticeStatusView icon="menu-book" title="Need more words" subtitle={`Save at least ${MIN_WORDS_FOR_QUIZ} words to play games.`} actionLabel="Back" onAction={() => setGame('menu')} />
      </View>
    );
  }

  if (game === 'menu') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppHeader title="Games" showBack />
        <View style={{ flex: 1, padding: spacing.containerMargin, gap: spacing.md }}>
        <Card onPress={() => launch('matching')}>
          <View style={styles.gameCardInner}>
            <Icon name="extension" size={36} color={colors.primary} />
            <Text style={[typography.heading, { color: colors.onSurface, marginTop: spacing.sm }]}>Matching</Text>
            <Text style={[typography.pinyin, { color: colors.outline, textAlign: 'center' }]}>Pair each 汉字 with its English meaning</Text>
          </View>
        </Card>
        <Card onPress={() => launch('rapid')}>
          <View style={styles.gameCardInner}>
            <Icon name="bolt" size={36} color={colors.primary} />
            <Text style={[typography.heading, { color: colors.onSurface, marginTop: spacing.sm }]}>Rapid Fire</Text>
            <Text style={[typography.pinyin, { color: colors.outline, textAlign: 'center' }]}>Answer as many as you can in {RAPID_SECONDS}s</Text>
          </View>
        </Card>
        </View>
      </View>
    );
  }

  if (game === 'matching') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppHeader title="Games" showBack />
        <View style={{ flex: 1, padding: spacing.containerMargin }}>
        <MatchingGame pool={pool} onFinished={() => setGame('menu')} />
        <Pressable style={{ paddingVertical: 14 }} onPress={() => setGame('menu')}>
          <Text style={[typography.label, { fontSize: 14, color: colors.onSurfaceVariant, textAlign: 'center' }]}>Quit</Text>
        </Pressable>
        </View>
      </View>
    );
  }

  if (game === 'rapidDone') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppHeader title="Games" showBack />
        <PracticeStatusView
          icon="bolt"
          title={`${score} correct`}
          subtitle={`in ${RAPID_SECONDS} seconds`}
          actionLabel="Play Again"
          onAction={() => startRapid(pool)}
          secondaryLabel="Back to Games"
          onSecondary={() => setGame('menu')}
        />
      </View>
    );
  }

  const q = questions[qIndex];
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title="Games" showBack />
      <View style={{ flex: 1, padding: spacing.containerMargin }}>
      <View style={styles.rapidHeader}>
        <Text style={[typography.heading, { color: colors.primary }]}>Score {score}</Text>
        <Text style={[typography.heading, { color: timeLeft <= 5 ? colors.error : colors.onSurface }]}>{timeLeft}s</Text>
      </View>
      <View style={styles.prompt}>
        <Text style={{ fontFamily: fonts.hanzi, fontSize: 64, color: colors.onSurface }}>{q.word.wordZh}</Text>
      </View>
      <View style={{ gap: spacing.sm }}>
        {q.options.map((opt, i) => {
          let bg = colors.surface;
          let border = colors.outlineVariant;
          if (picked !== null) {
            if (i === q.correctIndex) { bg = colors.primaryContainer; border = colors.primaryContainer; }
            else if (i === picked) { bg = colors.errorContainer; border = colors.error; }
          }
          const txt = picked !== null && i === q.correctIndex ? colors.onPrimaryContainer : colors.onSurface;
          return (
            <Pressable key={i} style={[styles.option, { backgroundColor: bg, borderColor: border }]} onPress={() => answerRapid(i)} disabled={picked !== null}>
              <Text style={[typography.body, { color: txt, textAlign: 'center' }]}>{opt}</Text>
            </Pressable>
          );
        })}
      </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gameCardInner: { alignItems: 'center', paddingVertical: spacing.sm },
  rapidHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  prompt: { alignItems: 'center', marginVertical: spacing.lg },
  option: { borderRadius: radius.md, padding: 18, borderWidth: 1 },
});
