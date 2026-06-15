import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNetwork } from '../lib/network-context';
import { useTheme } from '../theme/theme-context';
import { spacing, radius, typography, fonts } from '../theme/theme';

/** Full-screen "Lost in the Clouds" state shown when device is offline. */
export function OfflineScreen() {
  const { colors } = useTheme();
  const { recheck } = useNetwork();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Atmospheric illustration — glowing hanzi on dark background */}
      <View style={[styles.illustration, { backgroundColor: colors.surface }]}>
        <Text style={[styles.floatingChar, { color: colors.primary, opacity: 0.25, top: 24, left: 40 }]}>福</Text>
        <Text style={[styles.floatingChar, { color: colors.primary, opacity: 0.18, top: 60, right: 50 }]}>道</Text>
        <Text style={[styles.floatingChar, { color: colors.primary, opacity: 0.3, bottom: 30, left: 60 }]}>德</Text>
        <Text style={[styles.floatingChar, { color: colors.primary, opacity: 0.2, bottom: 50, right: 40 }]}>水</Text>

        {/* Central figure */}
        <View style={[styles.centerFigure, { backgroundColor: colors.primarySoft }]}>
          <MaterialIcons name="cloud-off" size={48} color={colors.primary} />
        </View>
      </View>

      {/* Text content */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.onSurface }]}>Lost in the Clouds</Text>
        <Text style={[typography.body, { color: colors.onSurfaceVariant, textAlign: 'center', lineHeight: 22 }]}>
          AI Vision requires a connection, but your{' '}
          <Text style={{ color: colors.onSurface, fontFamily: fonts.headlineSemi }}>Library</Text>
          {' '}and{' '}
          <Text style={{ color: colors.onSurface, fontFamily: fonts.headlineSemi }}>SRS</Text>
          {' '}are still available.
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          style={[styles.retryBtn, { borderColor: colors.primary }]}
          onPress={recheck}
        >
          <MaterialIcons name="refresh" size={18} color={colors.primary} />
          <Text style={[typography.label, { fontSize: 15, color: colors.primary }]}>Retry</Text>
        </Pressable>

        <Pressable
          style={[styles.libraryBtn, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}
          onPress={() => router.push('/(tabs)/vocabulary')}
        >
          <Text style={[typography.label, { fontSize: 15, color: colors.onSurface }]}>Go to Library</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xl },
  illustration: {
    width: '100%', height: 260, position: 'relative',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  floatingChar: { position: 'absolute', fontFamily: fonts.hanzi, fontSize: 64 },
  centerFigure: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center',
  },
  content: { alignItems: 'center', paddingHorizontal: spacing.xl, gap: spacing.sm },
  title: { fontFamily: fonts.headlineSemi, fontSize: 28, textAlign: 'center' },
  actions: { width: '100%', paddingHorizontal: spacing.containerMargin, gap: spacing.md },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    borderRadius: radius.pill, paddingVertical: 15, borderWidth: 1.5,
  },
  libraryBtn: {
    alignItems: 'center', justifyContent: 'center',
    borderRadius: radius.pill, paddingVertical: 15, borderWidth: 1,
  },
});
