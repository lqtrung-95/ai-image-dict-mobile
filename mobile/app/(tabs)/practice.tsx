import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/lib/auth-context';
import { LoginRequiredPrompt } from '../../src/components/login-required-prompt';
import { Screen, Card, Icon } from '../../src/theme/ui-primitives';
import { useTheme } from '../../src/theme/theme-context';
import { spacing, radius, typography } from '../../src/theme/theme';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

const MODES: { route: string; icon: IconName; title: string; subtitle: string }[] = [
  { route: '/practice-flashcards', icon: 'style', title: 'Flashcards', subtitle: 'Spaced repetition review of words due today' },
  { route: '/practice-quiz', icon: 'quiz', title: 'Quiz', subtitle: 'Multiple choice, listening, and type-pinyin' },
  { route: '/practice-games', icon: 'sports-esports', title: 'Games', subtitle: 'Matching and rapid-fire vocabulary games' },
];

export default function PracticeMenuScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  if (!user) {
    return <LoginRequiredPrompt message="Log in to practice with flashcards, quizzes, and games." />;
  }

  return (
    <Screen scroll contentStyle={{ gap: spacing.md }}>
      <Text style={[typography.headline, { color: colors.onSurface }]}>Practice</Text>
      <Text style={[typography.body, { color: colors.onSurfaceVariant, marginTop: -spacing.xs }]}>
        Pick a mode to strengthen your vocabulary.
      </Text>

      {MODES.map((mode) => (
        <Card key={mode.route} onPress={() => router.push(mode.route as never)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={mode.icon} size={26} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.heading, { color: colors.onSurface }]}>{mode.title}</Text>
              <Text style={[typography.pinyin, { color: colors.outline, marginTop: 2 }]}>{mode.subtitle}</Text>
            </View>
            <Icon name="chevron-right" size={24} color={colors.outline} />
          </View>
        </Card>
      ))}
    </Screen>
  );
}
