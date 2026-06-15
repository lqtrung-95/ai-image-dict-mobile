import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '../src/lib/auth-context';
import { LoginRequiredPrompt } from '../src/components/login-required-prompt';
import { PracticeFlashcard } from '../src/components/practice-flashcard';
import { PracticeStatusView } from '../src/components/practice-status-view';
import { AppHeader } from '../src/components/app-header';
import { fetchDueWords, submitAttempt, DueWord, SrsRating } from '../src/lib/practice-service';
import { showError } from '../src/lib/toast';
import { useTheme } from '../src/theme/theme-context';
import { spacing, radius, typography } from '../src/theme/theme';

type SessionState = 'loading' | 'empty' | 'practicing' | 'done' | 'error';

export default function PracticeScreen() {
  const { user } = useAuth();
  const { course: courseId } = useLocalSearchParams<{ course?: string }>();
  const { colors } = useTheme();
  const [state, setState] = useState<SessionState>('loading');
  const [words, setWords] = useState<DueWord[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState({ again: 0, correct: 0 });
  const cardShownAt = useRef(Date.now());

  const startSession = useCallback(async () => {
    setState('loading');
    setIndex(0);
    setFlipped(false);
    setResults({ again: 0, correct: 0 });
    try {
      const data = await fetchDueWords(20, courseId);
      if (data.items.length === 0) {
        setState('empty');
      } else {
        setWords(data.items);
        cardShownAt.current = Date.now();
        setState('practicing');
      }
    } catch {
      setState('error');
    }
  }, [courseId]);

  useEffect(() => {
    if (user) startSession();
  }, [user, startSession, courseId]);

  if (!user) {
    return <LoginRequiredPrompt message="Log in to practice with flashcards and track your learning streak." />;
  }

  const handleRate = async (rating: SrsRating) => {
    const word = words[index];
    const responseTimeMs = Date.now() - cardShownAt.current;
    setResults((r) => (rating === 1 ? { ...r, again: r.again + 1 } : { ...r, correct: r.correct + 1 }));

    // Advance immediately for snappy UX; recording happens in background
    submitAttempt(word.id, rating, responseTimeMs).catch(() =>
      showError('Sync issue', `"${word.wordZh}" rating wasn't saved. It will appear again next session.`)
    );

    if (index + 1 >= words.length) {
      setState('done');
    } else {
      setIndex(index + 1);
      setFlipped(false);
      cardShownAt.current = Date.now();
    }
  };

  if (state === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppHeader title="Flashcards" showBack />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (state === 'error') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppHeader title="Flashcards" showBack />
        <PracticeStatusView icon="error-outline" title="Couldn't load words" subtitle="Please try again." actionLabel="Retry" onAction={startSession} />
      </View>
    );
  }

  if (state === 'empty') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppHeader title="Flashcards" showBack />
        <PracticeStatusView icon="celebration" title="All caught up!" subtitle="No words due for review. Capture more photos or come back later." />
      </View>
    );
  }

  if (state === 'done') {
    const total = results.again + results.correct;
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppHeader title="Flashcards" showBack />
        <PracticeStatusView
          icon="check-circle"
          title="Session complete!"
          subtitle={`${results.correct} of ${total} correct${results.again > 0 ? ` — ${results.again} to review again soon` : ' — perfect run!'}`}
          actionLabel="Practice More"
          onAction={startSession}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title="Flashcards" showBack />
      <View style={{ flex: 1, padding: spacing.containerMargin }}>
      <View style={styles.progressRow}>
        <Text style={[typography.label, { fontSize: 14, color: colors.onSurfaceVariant }]}>
          {index + 1} / {words.length}
        </Text>
        <View style={[styles.progressBar, { backgroundColor: colors.surfaceContainerHigh }]}>
          <View style={[styles.progressFill, { width: `${((index + 1) / words.length) * 100}%`, backgroundColor: colors.primary }]} />
        </View>
      </View>
      <PracticeFlashcard word={words[index]} flipped={flipped} onFlip={() => setFlipped(true)} onRate={handleRate} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  progressBar: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
});
