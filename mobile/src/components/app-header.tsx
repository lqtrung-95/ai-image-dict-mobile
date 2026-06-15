import React from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/theme-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { useDrawer } from '../lib/drawer-context';
import { spacing, typography, fonts } from '../theme/theme';

interface AppHeaderProps {
  /** Page title for sub-pages. When omitted, shows the brand wordmark. */
  title?: string;
  /** Show a back chevron (left) instead of the hamburger menu. */
  showBack?: boolean;
}

export function AppHeader({ title, showBack = false }: AppHeaderProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { openDrawer } = useDrawer();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const initials = user?.displayName
    ? user.displayName.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? '??';

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + spacing.xs,
          backgroundColor: colors.background,
          borderBottomColor: colors.outlineVariant,
        },
      ]}
    >
      {showBack ? (
        <Pressable onPress={() => router.back()} style={styles.menuBtn} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
        </Pressable>
      ) : (
        <Pressable onPress={openDrawer} style={styles.menuBtn} hitSlop={8}>
          <MaterialIcons name="menu" size={26} color={colors.onSurface} />
        </Pressable>
      )}

      <Text
        style={[styles.title, { color: colors.onSurface, fontFamily: fonts.headlineSemi }]}
        numberOfLines={1}
      >
        {title ?? '墨选 AI Hanzi'}
      </Text>

      <Pressable onPress={() => router.push('/(tabs)/profile')} style={[styles.avatar, { backgroundColor: colors.primaryContainer }]} hitSlop={8}>
        {user?.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
        ) : (
          <Text style={[typography.label, { color: colors.onPrimaryContainer, fontSize: 12 }]}>
            {user ? initials : '?'}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.containerMargin,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuBtn: {
    padding: 4,
    width: 34,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    letterSpacing: 0.3,
    marginHorizontal: spacing.sm,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: 34, height: 34, borderRadius: 17 },
});
