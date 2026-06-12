import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/lib/auth-context';
import { LoginRequiredPrompt } from '../../src/components/login-required-prompt';

interface ModeCard {
  route: string;
  emoji: string;
  title: string;
  subtitle: string;
  accent: string;
}

const MODES: ModeCard[] = [
  {
    route: '/practice-flashcards',
    emoji: '🎴',
    title: 'Flashcards',
    subtitle: 'Spaced repetition review of words due today',
    accent: '#a855f7',
  },
  {
    route: '/practice-quiz',
    emoji: '❓',
    title: 'Quiz',
    subtitle: 'Multiple choice, listening, and type-pinyin challenges',
    accent: '#22c55e',
  },
  {
    route: '/practice-games',
    emoji: '🎮',
    title: 'Games',
    subtitle: 'Matching and rapid-fire vocabulary games',
    accent: '#3b82f6',
  },
];

export default function PracticeMenuScreen() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) {
    return <LoginRequiredPrompt message="Log in to practice with flashcards, quizzes, and games." />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.heading}>Practice</Text>
      <Text style={styles.subheading}>Pick a mode to strengthen your vocabulary.</Text>

      {MODES.map((mode) => (
        <TouchableOpacity
          key={mode.route}
          style={[styles.card, { borderColor: `${mode.accent}55` }]}
          onPress={() => router.push(mode.route as never)}
          activeOpacity={0.85}
        >
          <Text style={styles.emoji}>{mode.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{mode.title}</Text>
            <Text style={styles.cardSubtitle}>{mode.subtitle}</Text>
          </View>
          <Text style={[styles.chevron, { color: mode.accent }]}>›</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  heading: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginTop: 8 },
  subheading: { fontSize: 15, color: '#94a3b8', marginBottom: 24 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: '#1e293b', borderRadius: 16, padding: 20, marginBottom: 14,
    borderWidth: 1,
  },
  emoji: { fontSize: 32 },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  cardSubtitle: { color: '#94a3b8', fontSize: 13, marginTop: 4, lineHeight: 18 },
  chevron: { fontSize: 28, fontWeight: '300' },
});
