import { View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/theme-context';
import { spacing, typography } from '../theme/theme';
import { AppButton } from '../theme/ui-primitives';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

// Shared centered状态 view for practice/quiz/game loading, empty, and done states.
export function PracticeStatusView({
  icon, title, subtitle, actionLabel, onAction, secondaryLabel, onSecondary,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
      <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg }}>
        <MaterialIcons name={icon} size={40} color={colors.primary} />
      </View>
      <Text style={[typography.headline, { color: colors.onSurface, textAlign: 'center' }]}>{title}</Text>
      {subtitle ? (
        <Text style={[typography.body, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.xs }]}>{subtitle}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <AppButton label={actionLabel} onPress={onAction} style={{ marginTop: spacing.lg }} />
      ) : null}
      {secondaryLabel && onSecondary ? (
        <AppButton label={secondaryLabel} variant="secondary" onPress={onSecondary} style={{ marginTop: spacing.sm }} />
      ) : null}
    </View>
  );
}
