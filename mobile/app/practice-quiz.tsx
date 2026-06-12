import { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../src/lib/auth-context';
import { LoginRequiredPrompt } from '../src/components/login-required-prompt';
import { speakChinese } from '../src/lib/tts-speech-service';
import {
  QuizMode, QuizQuestion, loadQuizPool, buildChoiceQuestions, buildPinyinQuestions,
  isPinyinCorrect, recordQuizAnswer, MIN_WORDS_FOR_QUIZ,
} from '../src/lib/quiz-service';

type Phase = 'menu' | 'loading' | 'playing' | 'done' | 'tooFew' | 'error';

const MODE_LABELS: Record<QuizMode, { title: string; desc: string }> = {
  'multiple-choice': { title: '📝 Multiple Choice', desc: 'Read the word, pick the meaning' },
  listening: { title: '👂 Listening', desc: 'Hear the word, pick the meaning' },
  pinyin: { title: '⌨️ Type Pinyin', desc: 'See the word, type its pinyin' },
};

export default function QuizScreen() {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>('menu');
  const [mode, setMode] = useState<QuizMode>('multiple-choice');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [typed, setTyped] = useState('');
  const [revealed, setRevealed] = useState(false);

  if (!user) {
    return <LoginRequiredPrompt message="Log in to take vocabulary quizzes." />;
  }

  const start = async (selectedMode: QuizMode) => {
    setMode(selectedMode);
    setPhase('loading');
    try {
      const pool = await loadQuizPool();
      if (pool.length < MIN_WORDS_FOR_QUIZ) {
        setPhase('tooFew');
        return;
      }
      const built = selectedMode === 'pinyin'
        ? buildPinyinQuestions(pool)
        : buildChoiceQuestions(pool);
      setQuestions(built);
      setIndex(0);
      setScore(0);
      setSelected(null);
      setTyped('');
      setRevealed(false);
      setPhase('playing');
      if (selectedMode === 'listening') setTimeout(() => speakChinese(built[0].word.wordZh), 400);
    } catch {
      setPhase('error');
    }
  };

  const current = questions[index];

  const advance = (wasCorrect: boolean) => {
    if (wasCorrect) setScore((s) => s + 1);
    recordQuizAnswer(current.word.id, wasCorrect, mode);

    if (index + 1 >= questions.length) {
      setPhase('done');
    } else {
      const next = index + 1;
      setIndex(next);
      setSelected(null);
      setTyped('');
      setRevealed(false);
      if (mode === 'listening') setTimeout(() => speakChinese(questions[next].word.wordZh), 300);
    }
  };

  const handleChoice = (optionIndex: number) => {
    if (selected !== null) return;
    setSelected(optionIndex);
    const correct = optionIndex === current.correctIndex;
    setTimeout(() => advance(correct), 900); // brief pause to show right/wrong colors
  };

  const handlePinyinSubmit = () => {
    if (revealed) return;
    setRevealed(true);
    const correct = isPinyinCorrect(typed, current.word.wordPinyin);
    setTimeout(() => advance(correct), 1200);
  };

  // ---- render states ----

  if (phase === 'menu') {
    return (
      <View style={styles.container}>
        <Text style={styles.subtitle}>Choose a quiz mode</Text>
        {(Object.keys(MODE_LABELS) as QuizMode[]).map((m) => (
          <TouchableOpacity key={m} style={styles.modeCard} onPress={() => start(m)}>
            <Text style={styles.modeTitle}>{MODE_LABELS[m].title}</Text>
            <Text style={styles.modeDesc}>{MODE_LABELS[m].desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  if (phase === 'loading') {
    return <View style={[styles.container, styles.centered]}><ActivityIndicator size="large" color="#a855f7" /></View>;
  }

  if (phase === 'error') {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.subtitle}>Something went wrong.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => setPhase('menu')}>
          <Text style={styles.primaryButtonText}>Back to modes</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (phase === 'tooFew') {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.bigEmoji}>📚</Text>
        <Text style={styles.title}>Need more words</Text>
        <Text style={styles.subtitle}>
          Save at least {MIN_WORDS_FOR_QUIZ} words to play quizzes. Capture more photos!
        </Text>
      </View>
    );
  }

  if (phase === 'done') {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.bigEmoji}>{pct >= 80 ? '🏆' : pct >= 50 ? '👍' : '💪'}</Text>
        <Text style={styles.title}>{score} / {questions.length}</Text>
        <Text style={styles.subtitle}>{pct}% correct</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => start(mode)}>
          <Text style={styles.primaryButtonText}>Play Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => setPhase('menu')}>
          <Text style={styles.secondaryButtonText}>Change Mode</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // playing
  return (
    <View style={styles.container}>
      <Text style={styles.progress}>{index + 1} / {questions.length}  ·  Score {score}</Text>

      <View style={styles.prompt}>
        {mode === 'listening' ? (
          <TouchableOpacity style={styles.listenButton} onPress={() => speakChinese(current.word.wordZh)}>
            <Text style={{ fontSize: 48 }}>🔊</Text>
            <Text style={styles.listenHint}>Tap to replay</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => speakChinese(current.word.wordZh)}>
            <Text style={styles.promptZh}>{current.word.wordZh}</Text>
            {mode === 'pinyin' && <Text style={styles.promptEn}>{current.word.wordEn}</Text>}
          </TouchableOpacity>
        )}
      </View>

      {mode === 'pinyin' ? (
        <View>
          <TextInput
            style={styles.input}
            placeholder="Type the pinyin…"
            placeholderTextColor="#64748b"
            value={typed}
            onChangeText={setTyped}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!revealed}
            onSubmitEditing={handlePinyinSubmit}
          />
          {revealed && (
            <Text
              style={[
                styles.feedback,
                { color: isPinyinCorrect(typed, current.word.wordPinyin) ? '#22c55e' : '#ef4444' },
              ]}
            >
              {isPinyinCorrect(typed, current.word.wordPinyin)
                ? '✓ Correct!'
                : `✗ Answer: ${current.word.wordPinyin}`}
            </Text>
          )}
          {!revealed && (
            <TouchableOpacity
              style={[styles.primaryButton, !typed && styles.buttonDisabled]}
              onPress={handlePinyinSubmit}
              disabled={!typed}
            >
              <Text style={styles.primaryButtonText}>Check</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.options}>
          {current.options.map((opt, i) => {
            let bg = '#1e293b';
            if (selected !== null) {
              if (i === current.correctIndex) bg = '#16a34a';
              else if (i === selected) bg = '#dc2626';
            }
            return (
              <TouchableOpacity
                key={i}
                style={[styles.option, { backgroundColor: bg }]}
                onPress={() => handleChoice(i)}
                disabled={selected !== null}
              >
                <Text style={styles.optionText}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 20 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  subtitle: { fontSize: 15, color: '#94a3b8', textAlign: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  bigEmoji: { fontSize: 48, marginBottom: 16 },
  modeCard: { backgroundColor: '#1e293b', borderRadius: 14, padding: 20, marginBottom: 14 },
  modeTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  modeDesc: { color: '#94a3b8', fontSize: 13, marginTop: 4 },
  progress: { color: '#94a3b8', fontSize: 14, fontWeight: '600', textAlign: 'center', marginBottom: 24 },
  prompt: { alignItems: 'center', marginVertical: 32, minHeight: 120, justifyContent: 'center' },
  promptZh: { color: '#fff', fontSize: 56, fontWeight: 'bold', textAlign: 'center' },
  promptEn: { color: '#64748b', fontSize: 14, textAlign: 'center', marginTop: 8 },
  listenButton: { alignItems: 'center' },
  listenHint: { color: '#64748b', marginTop: 8, fontSize: 13 },
  options: { gap: 12 },
  option: { borderRadius: 12, padding: 18, borderWidth: 1, borderColor: '#334155' },
  optionText: { color: '#e2e8f0', fontSize: 16, textAlign: 'center' },
  input: {
    backgroundColor: '#1e293b', borderRadius: 12, padding: 16, color: '#fff',
    fontSize: 18, textAlign: 'center', borderWidth: 1, borderColor: '#334155', marginBottom: 16,
  },
  feedback: { fontSize: 18, fontWeight: '600', textAlign: 'center', marginTop: 8 },
  primaryButton: {
    backgroundColor: '#9333ea', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 36, marginTop: 8,
  },
  primaryButtonText: { color: '#fff', fontWeight: '600', fontSize: 16, textAlign: 'center' },
  buttonDisabled: { opacity: 0.5 },
  secondaryButton: { paddingVertical: 14, marginTop: 4 },
  secondaryButtonText: { color: '#94a3b8', fontWeight: '600', fontSize: 15, textAlign: 'center' },
});
