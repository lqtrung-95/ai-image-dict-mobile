import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme/theme-context';
import { spacing, radius, typography, makeShadow } from '../theme/theme';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

// "capture" renders as a raised center FAB (the app's primary action),
// matching the Stitch bottom-nav design.
const TAB_META: Record<string, { icon: IconName; label: string }> = {
  index: { icon: 'home', label: 'Home' },
  vocabulary: { icon: 'menu-book', label: 'Library' },
  capture: { icon: 'photo-camera', label: 'Capture' },
  practice: { icon: 'school', label: 'Practice' },
  profile: { icon: 'person', label: 'Profile' },
};

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View style={{ backgroundColor: colors.surface, paddingBottom: insets.bottom || spacing.md }}>
      <View
        style={[
          styles.bar,
          { backgroundColor: colors.surface, ...makeShadow(colors, 'card') },
        ]}
      >
        {state.routes.map((route, index) => {
          const meta = TAB_META[route.name];
          if (!meta) return null;
          const focused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          if (route.name === 'capture') {
            return (
              <View key={route.key} style={styles.centerSlot}>
                <Pressable
                  onPress={onPress}
                  style={({ pressed }) => [
                    styles.fab,
                    {
                      backgroundColor: colors.primaryContainer,
                      borderColor: colors.surface,
                      ...makeShadow(colors, 'jade'),
                    },
                    pressed && { transform: [{ scale: 0.92 }] },
                  ]}
                >
                  <MaterialIcons name="photo-camera" size={28} color={colors.onPrimaryContainer} />
                </Pressable>
              </View>
            );
          }

          return (
            <Pressable key={route.key} style={styles.tab} onPress={onPress}>
              <View style={[styles.tabInner, focused && { backgroundColor: colors.primarySoft }]}>
                <MaterialIcons
                  name={meta.icon}
                  size={22}
                  color={focused ? colors.primary : colors.onSurfaceVariant}
                />
              </View>
              <Text
                style={[
                  typography.label,
                  { fontSize: 10, color: focused ? colors.primary : colors.onSurfaceVariant },
                ]}
              >
                {meta.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    borderRadius: radius.xl,
    height: 64,
    paddingHorizontal: spacing.xs,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  tabInner: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill },
  centerSlot: { flex: 1, alignItems: 'center' },
  fab: {
    position: 'absolute',
    top: -34,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
  },
});
