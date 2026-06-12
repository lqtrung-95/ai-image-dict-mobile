import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { useAuth } from '../src/lib/auth-context';
import { LoginRequiredPrompt } from '../src/components/login-required-prompt';
import { PracticeFlashcard } from '../src/components/practice-flashcard';
import {
  fetchDueWords, submitAttempt, DueWord, SrsRating,
} from '../src/lib/practice-service';

type SessionState = 'loading' | 'empty' | 'practicing' | 'done' | 'error';

export default function PracticeScreen() {
  const { user } = useAuth();
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
      const data = await fetchDueWords(20);
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
  }, []);

  useEffect(() => {
    if (user) startSession();
  }, [user, startSession]);

  if (!user) {
    return <LoginRequiredPrompt message="Log in to practice with flashcards and track your learning streak." />;
  }

  const handleRate = async (rating: SrsRating) => {
    const word = words[index];
    const responseTimeMs = Date.now() - cardShownAt.current;
    setResults((r) => (rating === 1 ? { ...r, again: r.again + 1 } : { ...r, correct: r.correct + 1 }));

    // Advance immediately for snappy UX; recording happens in background
    submitAttempt(word.id, rating, responseTimeMs).catch(() =>
      Alert.alert('Sync issue', `"${word.wordZh}" rating wasn't saved. It will appear again next session.`)
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
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#a855f7" />
      </View>
    );
  }

  if (state === 'error') {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.subtitle}>Couldn't load practice words.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={startSession}>
          <Text style={styles.primaryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (state === 'empty') {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.bigEmoji}>🎉</Text>
        <Text style={styles.title}>All caught up!</Text>
        <Text style={styles.subtitle}>
          No words due for review. Capture more photos or come back later.
        </Text>
      </View>
    );
  }

  if (state === 'done') {
    const total = results.again + results.correct;
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.bigEmoji}>✅</Text>
        <Text style={styles.title}>Session complete!</Text>
        <Text style={styles.subtitle}>
          {results.correct} of {total} correct
          {results.again > 0 ? ` — ${results.again} to review again soon` : ' — perfect run!'}
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={startSession}>
          <Text style={styles.primaryButtonText}>Practice More</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          {index + 1} / {words.length}
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${((index + 1) / words.length) * 100}%` }]}
          />
        </View>
      </View>
      <PracticeFlashcard
        word={words[index]}
        flipped={flipped}
        onFlip={() => setFlipped(true)}
        onRate={handleRate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 20 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  bigEmoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#94a3b8', textAlign: 'center', marginBottom: 24 },
  primaryButton: {
    backgroundColor: '#9333ea', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 36,
  },
  primaryButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  progressText: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
  progressBar: {
    flex: 1, height: 6, backgroundColor: '#1e293b', borderRadius: 3, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#a855f7' },
});
