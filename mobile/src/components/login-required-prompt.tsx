import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme/theme-context';
import { spacing } from '../theme/theme';
import { Icon, AppButton } from '../theme/ui-primitives';

// Shown in place of protected content when the user is not logged in or lacks premium.
// Public-first UX: browsing stays open, important flows prompt for login/upgrade.
export function LoginRequiredPrompt({ message, actionLabel, actionRoute }: { message: string; actionLabel?: string; actionRoute?: string }) {
  const router = useRouter();
  const { colors } = useTheme();
  const label = actionLabel ?? 'Log in / Sign up';
  const route = actionRoute ?? '/(auth)/login';
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
      <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg }}>
        <Icon name="lock" size={36} color={colors.primary} />
      </View>
      <Text style={{ color: colors.onSurfaceVariant, fontSize: 16, textAlign: 'center', marginBottom: spacing.lg, lineHeight: 24 }}>
        {message}
      </Text>
      <AppButton label={label} onPress={() => router.push(route as never)} />
    </View>
  );
}
