import { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../src/lib/auth-context';
import { LoginRequiredPrompt } from '../src/components/login-required-prompt';
import { MatchingGame } from '../src/components/matching-game';
import {
  loadQuizPool, buildChoiceQuestions, QuizQuestion, recordQuizAnswer, MIN_WORDS_FOR_QUIZ,
} from '../src/lib/quiz-service';
import type { VocabularyItem } from '../src/lib/vocabulary-service';

type Game = 'menu' | 'loading' | 'tooFew' | 'matching' | 'rapid' | 'rapidDone';

const RAPID_SECONDS = 30;

export default function GamesScreen() {
  const { user } = useAuth();
  const [game, setGame] = useState<Game>('menu');
  const [pool, setPool] = useState<VocabularyItem[]>([]);

  // rapid-fire state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(RAPID_SECONDS);
  const [picked, setPicked] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  if (!user) {
    return <LoginRequiredPrompt message="Log in to play vocabulary games." />;
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
    return <View style={[styles.container, styles.centered]}><ActivityIndicator size="large" color="#a855f7" /></View>;
  }

  if (game === 'tooFew') {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.bigEmoji}>📚</Text>
        <Text style={styles.title}>Need more words</Text>
        <Text style={styles.subtitle}>Save at least {MIN_WORDS_FOR_QUIZ} words to play games.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => setGame('menu')}>
          <Text style={styles.primaryButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (game === 'menu') {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.gameCard} onPress={() => launch('matching')}>
          <Text style={styles.gameEmoji}>🧩</Text>
          <Text style={styles.gameTitle}>Matching</Text>
          <Text style={styles.gameDesc}>Pair each 汉字 with its English meaning</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.gameCard} onPress={() => launch('rapid')}>
          <Text style={styles.gameEmoji}>⚡</Text>
          <Text style={styles.gameTitle}>Rapid Fire</Text>
          <Text style={styles.gameDesc}>Answer as many as you can in {RAPID_SECONDS}s</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (game === 'matching') {
    return (
      <View style={styles.container}>
        <MatchingGame pool={pool} onFinished={() => setGame('menu')} />
        <TouchableOpacity style={styles.secondaryButton} onPress={() => setGame('menu')}>
          <Text style={styles.secondaryButtonText}>Quit</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (game === 'rapidDone') {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.bigEmoji}>⚡</Text>
        <Text style={styles.title}>{score} correct</Text>
        <Text style={styles.subtitle}>in {RAPID_SECONDS} seconds</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => startRapid(pool)}>
          <Text style={styles.primaryButtonText}>Play Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => setGame('menu')}>
          <Text style={styles.secondaryButtonText}>Back to Games</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // rapid playing
  const q = questions[qIndex];
  return (
    <View style={styles.container}>
      <View style={styles.rapidHeader}>
        <Text style={styles.rapidScore}>Score {score}</Text>
        <Text style={[styles.rapidTimer, timeLeft <= 5 && { color: '#ef4444' }]}>{timeLeft}s</Text>
      </View>
      <View style={styles.prompt}>
        <Text style={styles.promptZh}>{q.word.wordZh}</Text>
      </View>
      <View style={styles.options}>
        {q.options.map((opt, i) => {
          let bg = '#1e293b';
          if (picked !== null) {
            if (i === q.correctIndex) bg = '#16a34a';
            else if (i === picked) bg = '#dc2626';
          }
          return (
            <TouchableOpacity
              key={i}
              style={[styles.option, { backgroundColor: bg }]}
              onPress={() => answerRapid(i)}
              disabled={picked !== null}
            >
              <Text style={styles.optionText}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 20 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  bigEmoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#94a3b8', textAlign: 'center', marginBottom: 24 },
  gameCard: {
    backgroundColor: '#1e293b', borderRadius: 16, padding: 24, marginBottom: 16, alignItems: 'center',
  },
  gameEmoji: { fontSize: 40, marginBottom: 8 },
  gameTitle: { color: '#fff', fontSize: 20, fontWeight: '600' },
  gameDesc: { color: '#94a3b8', fontSize: 13, marginTop: 4, textAlign: 'center' },
  rapidHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  rapidScore: { color: '#a855f7', fontSize: 18, fontWeight: '700' },
  rapidTimer: { color: '#fff', fontSize: 18, fontWeight: '700' },
  prompt: { alignItems: 'center', marginVertical: 24 },
  promptZh: { color: '#fff', fontSize: 56, fontWeight: 'bold' },
  options: { gap: 12 },
  option: { borderRadius: 12, padding: 18, borderWidth: 1, borderColor: '#334155' },
  optionText: { color: '#e2e8f0', fontSize: 16, textAlign: 'center' },
  primaryButton: {
    backgroundColor: '#9333ea', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 36, marginTop: 8,
  },
  primaryButtonText: { color: '#fff', fontWeight: '600', fontSize: 16, textAlign: 'center' },
  secondaryButton: { paddingVertical: 14, marginTop: 4 },
  secondaryButtonText: { color: '#94a3b8', fontWeight: '600', fontSize: 15, textAlign: 'center' },
});
