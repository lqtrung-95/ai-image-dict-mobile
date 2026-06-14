import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme/theme-context';
import { spacing } from '../theme/theme';
import { Icon, AppButton } from '../theme/ui-primitives';

// Shown in place of protected content when the user is not logged in.
// Public-first UX: browsing stays open, important flows prompt for login.
export function LoginRequiredPrompt({ message }: { message: string }) {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
      <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg }}>
        <Icon name="lock" size={36} color={colors.primary} />
      </View>
      <Text style={{ color: colors.onSurfaceVariant, fontSize: 16, textAlign: 'center', marginBottom: spacing.lg, lineHeight: 24 }}>
        {message}
      </Text>
      <AppButton label="Log in / Sign up" onPress={() => router.push('/(auth)/login')} />
    </View>
  );
}
