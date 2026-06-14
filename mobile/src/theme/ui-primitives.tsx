import React from 'react';
import {
  View, Text, Pressable, ScrollView, ViewStyle, TextStyle, StyleProp,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from './theme-context';
import { spacing, radius, typography, makeShadow } from './theme';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

// Themed Material icon (Stitch uses Material Symbols; MaterialIcons covers them)
export function Icon({ name, size = 24, color }: { name: IconName; size?: number; color?: string }) {
  const { colors } = useTheme();
  return <MaterialIcons name={name} size={size} color={color ?? colors.onSurface} />;
}

export function Screen({
  children, scroll = false, contentStyle, edgeToEdge = false,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  edgeToEdge?: boolean; // skip top safe-area padding (e.g. screens with own header)
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const topPad = edgeToEdge ? spacing.md : insets.top + spacing.sm;

  if (scroll) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={[{ paddingHorizontal: spacing.containerMargin, paddingTop: topPad, paddingBottom: spacing.containerMargin }, contentStyle]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    );
  }
  return (
    <View style={[{ flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.containerMargin, paddingTop: topPad }, contentStyle as ViewStyle]}>
      {children}
    </View>
  );
}

// Soft "paper lift" card. Press effect is a subtle scale-down (no extra lift).
export function Card({
  children, onPress, style, padded = true,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}) {
  const { colors } = useTheme();
  const base: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: padded ? spacing.md : 0,
    ...makeShadow(colors, 'card'),
  };
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [base, pressed && { transform: [{ scale: 0.98 }] }, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}

// Uppercase eyebrow label
export function Eyebrow({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  const { colors } = useTheme();
  return (
    <Text style={[typography.label, { color: colors.outline, textTransform: 'uppercase', letterSpacing: 1 }, style]}>
      {children}
    </Text>
  );
}

// Pale-jade chip (HSK levels, categories) — no border
export function Chip({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ backgroundColor: colors.primarySoft, borderRadius: radius.md, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={[typography.label, { color: colors.primaryContainer }]}>{label}</Text>
    </View>
  );
}

// Pill button. Primary = jade fill; secondary = ghost with jade border.
export function AppButton({
  label, onPress, variant = 'primary', icon, disabled, style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  icon?: IconName;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
          backgroundColor: isPrimary ? colors.primaryContainer : 'transparent',
          borderRadius: radius.pill, paddingVertical: 14, paddingHorizontal: spacing.lg,
          borderWidth: isPrimary ? 0 : 1.5, borderColor: colors.primary,
          ...(isPrimary ? makeShadow(colors, 'jade') : {}),
        },
        pressed && { transform: [{ scale: 0.98 }] },
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      {icon && <Icon name={icon} size={18} color={isPrimary ? colors.onPrimaryContainer : colors.primary} />}
      <Text style={[typography.label, { fontSize: 14, color: isPrimary ? colors.onPrimaryContainer : colors.primary }]}>
        {label}
      </Text>
    </Pressable>
  );
}
