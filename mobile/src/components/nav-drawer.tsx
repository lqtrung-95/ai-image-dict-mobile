import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Pressable, Animated, StyleSheet, Dimensions,
  TouchableWithoutFeedback, ScrollView, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/theme-context';
import { useAuth } from '../lib/auth-context';
import { useDrawer } from '../lib/drawer-context';
import { spacing, radius, typography, fonts } from '../theme/theme';

const DRAWER_WIDTH = Dimensions.get('window').width * 0.78;

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

interface NavItem {
  icon: IconName;
  label: string;
  route: string;
}

const NAV_ITEMS: NavItem[] = [
  { icon: 'history', label: 'Analysis History', route: '/history' },
  { icon: 'auto-stories', label: 'Photo Stories', route: '/stories' },
  { icon: 'folder', label: 'Personal Lists', route: '/lists' },
  { icon: 'bar-chart', label: 'Progress', route: '/progress' },
  { icon: 'school', label: 'Courses', route: '/courses' },
  { icon: 'file-download', label: 'Import Words', route: '/import-vocabulary' },
];

export function NavDrawer() {
  const { colors } = useTheme();
  const { user, logout } = useAuth();
  const { isOpen, closeDrawer } = useDrawer();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  // Keep mounted until close animation finishes so it doesn't vanish instantly
  const [mounted, setMounted] = useState(isOpen);

  useEffect(() => {
    if (isOpen) setMounted(true);
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: isOpen ? 0 : -DRAWER_WIDTH,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: isOpen ? 0.5 : 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start(() => { if (!isOpen) setMounted(false); });
  }, [isOpen]);

  if (!mounted) return null;

  const navigate = (route: string) => {
    closeDrawer();
    setTimeout(() => router.push(route as never), 10);
  };

  const initials = user?.displayName
    ? user.displayName.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? '??';

  const displayName = user?.displayName ?? user?.email ?? 'Guest';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={isOpen ? 'auto' : 'none'}>
      {/* Dim overlay */}
      <TouchableWithoutFeedback onPress={closeDrawer}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: overlayOpacity }]} />
      </TouchableWithoutFeedback>

      {/* Drawer panel */}
      <Animated.View
        style={[
          styles.drawer,
          {
            width: DRAWER_WIDTH,
            backgroundColor: colors.surface,
            paddingTop: insets.top,
            paddingBottom: insets.bottom + spacing.md,
            transform: [{ translateX }],
          },
        ]}
      >
        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          {/* User header */}
          <View style={[styles.userSection, { borderBottomColor: colors.outlineVariant }]}>
            <View style={[styles.avatar, { backgroundColor: colors.primaryContainer, overflow: 'hidden' }]}>
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={{ width: 56, height: 56, borderRadius: 28 }} />
              ) : (
                <Text style={[typography.heading, { color: colors.onPrimaryContainer, fontSize: 20 }]}>
                  {initials}
                </Text>
              )}
            </View>
            <Text style={[typography.heading, { color: colors.onSurface, marginTop: spacing.sm }]} numberOfLines={1}>
              {displayName}
            </Text>
            {user && (
              <Text style={[typography.label, { color: colors.outline, marginTop: 2 }]} numberOfLines={1}>
                {user.email}
              </Text>
            )}
          </View>

          {/* Nav items */}
          <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.sm }}>
            {NAV_ITEMS.map((item) => (
              <Pressable
                key={item.route}
                style={({ pressed }) => [
                  styles.navItem,
                  { borderRadius: radius.md },
                  pressed && { backgroundColor: colors.primarySoft },
                ]}
                onPress={() => navigate(item.route)}
              >
                <MaterialIcons name={item.icon} size={22} color={colors.primary} />
                <Text style={[typography.body, { color: colors.onSurface, fontFamily: fonts.bodyMedium }]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* Sign out */}
        {user && (
          <Pressable
            style={({ pressed }) => [
              styles.signOut,
              { borderTopColor: colors.outlineVariant, marginHorizontal: spacing.md },
              pressed && { opacity: 0.7 },
            ]}
            onPress={async () => { closeDrawer(); await logout(); }}
          >
            <MaterialIcons name="logout" size={20} color={colors.error} />
            <Text style={[typography.label, { color: colors.error, fontSize: 14 }]}>Sign Out</Text>
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 16,
  },
  userSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.sm,
  },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
});
