import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/lib/auth-context';
import { WordOfDayCard } from '../../src/components/word-of-day-card';

interface QuickLink {
  route: string;
  emoji: string;
  title: string;
  subtitle: string;
  guestOk: boolean;
}

const QUICK_LINKS: QuickLink[] = [
  { route: '/(tabs)/capture', emoji: '📷', title: 'Capture', subtitle: 'Analyze a photo', guestOk: true },
  { route: '/(tabs)/vocabulary', emoji: '📚', title: 'My Words', subtitle: 'Browse your library', guestOk: false },
  { route: '/lists', emoji: '🗂', title: 'Lists', subtitle: 'Organize into collections', guestOk: false },
  { route: '/history', emoji: '🕘', title: 'History', subtitle: 'Past photo analyses', guestOk: false },
  { route: '/stories', emoji: '📖', title: 'Stories', subtitle: 'Group photos into stories', guestOk: false },
  { route: '/(tabs)/practice', emoji: '🎯', title: 'Practice', subtitle: 'Flashcards, quiz & games', guestOk: false },
  { route: '/progress', emoji: '📈', title: 'Progress', subtitle: 'Streaks, stats & goals', guestOk: false },
  { route: '/courses', emoji: '🎓', title: 'Courses', subtitle: 'Community word sets', guestOk: false },
  { route: '/import-vocabulary', emoji: '📥', title: 'Import', subtitle: 'From articles or text', guestOk: false },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const links = QUICK_LINKS.filter((l) => user || l.guestOk);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.greeting}>你好, {user?.displayName ?? 'there'}! 👋</Text>
      <Text style={styles.subtitle}>
        {user ? 'Ready to learn some Chinese?' : 'Capture a photo to start learning Chinese vocabulary.'}
      </Text>

      {user && <WordOfDayCard />}

      <View style={styles.grid}>
        {links.map((link) => (
          <TouchableOpacity
            key={link.route}
            style={styles.tile}
            onPress={() => router.push(link.route as never)}
            activeOpacity={0.85}
          >
            <Text style={styles.tileEmoji}>{link.emoji}</Text>
            <Text style={styles.tileTitle}>{link.title}</Text>
            <Text style={styles.tileSubtitle}>{link.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {!user && (
        <TouchableOpacity style={styles.loginCard} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.loginText}>Log in to unlock your library, practice, and more →</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  greeting: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginTop: 8, marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#94a3b8', marginBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: {
    width: '47%', backgroundColor: '#1e293b', borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: '#334155',
  },
  tileEmoji: { fontSize: 28, marginBottom: 8 },
  tileTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  tileSubtitle: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  loginCard: {
    backgroundColor: '#9333ea22', borderColor: '#9333ea55', borderWidth: 1,
    borderRadius: 14, padding: 16, marginTop: 20,
  },
  loginText: { color: '#c4b5fd', textAlign: 'center', fontSize: 14 },
});
