import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ScrollView, Image, Animated } from 'react-native';
import { showError } from '../../src/lib/toast';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import { useAuth } from '../../src/lib/auth-context';
import { usePremium } from '../../src/lib/premium-context';
import { exportVocabularyToAnki } from '../../src/lib/anki-export-service';
import { TextInputModal } from '../../src/components/text-input-modal';
import { fetchProfile, updateDisplayName, deleteAccount, uploadAvatar } from '../../src/lib/user-settings-service';
import { fetchStats, UserStats } from '../../src/lib/stats-service';
import { AppHeader } from '../../src/components/app-header';
import { AppButton, Icon } from '../../src/theme/ui-primitives';
import { useTheme, ThemeMode } from '../../src/theme/theme-context';
import { spacing, radius, typography, fonts, makeShadow } from '../../src/theme/theme';

function StatCardSkeleton() {
  const { colors } = useTheme();
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
    return () => anim.stopAnimation();
  }, [anim]);
  return (
    <Animated.View style={[styles.statCard, { backgroundColor: colors.surface, opacity: anim, alignItems: 'center', gap: 6 }]}>
      <View style={{ width: 48, height: 28, borderRadius: 6, backgroundColor: colors.surfaceContainer }} />
      <View style={{ width: 80, height: 10, borderRadius: 5, backgroundColor: colors.surfaceContainer }} />
    </Animated.View>
  );
}

// Compute highest HSK level from distribution
function computeHskBadge(dist: Record<string, number>): string | null {
  const levels = ['hsk6', 'hsk5', 'hsk4', 'hsk3', 'hsk2', 'hsk1'];
  for (const l of levels) {
    if ((dist[l] ?? 0) > 0) return l.replace('hsk', 'HSK ') + ' Learner';
  }
  return null;
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { isPremiumUser, refresh: refreshPremium } = usePremium();
  const { colors, mode, setMode } = useTheme();
  const router = useRouter();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      fetchProfile().then((p) => {
        setDisplayName(p.display_name);
        setAvatarUrl(p.avatar_url);
      }).catch(() => {});
    }
  }, [user]);

  useFocusEffect(useCallback(() => {
    if (user) fetchStats().then(setStats).catch(() => {});
  }, [user]));

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppHeader />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
          <View style={[styles.avatarRing, { borderColor: colors.primary, backgroundColor: colors.primarySoft }]}>
            <Icon name="person" size={48} color={colors.primary} />
          </View>
          <Text style={[typography.headline, { color: colors.onSurface, marginTop: spacing.md, marginBottom: spacing.xs }]}>
            Guest
          </Text>
          <Text style={[typography.body, { color: colors.onSurfaceVariant, textAlign: 'center', marginBottom: spacing.xl }]}>
            Log in to save vocabulary, track progress, and sync across devices.
          </Text>
          <AppButton label="Log in / Sign up" onPress={() => router.push('/(auth)/login')} />
        </View>
      </View>
    );
  }

  const initials = displayName
    ? displayName.slice(0, 2).toUpperCase()
    : user.email?.slice(0, 2).toUpperCase() ?? '??';

  const run = async (key: string, fn: () => Promise<void>, errTitle: string) => {
    setBusy(key);
    try { await fn(); } catch (err) { showError(errTitle, err instanceof Error ? err.message : 'Try again'); } finally { setBusy(null); }
  };

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showError('Permission required', 'Allow photo library access to change your avatar.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    await run('avatar', async () => {
      const url = await uploadAvatar(uri);
      setAvatarUrl(url);
    }, 'Upload failed');
  };

  const submitName = async (name: string) => {
    setNameModalOpen(false);
    await run('name', async () => { await updateDisplayName(name); setDisplayName(name); }, 'Update failed');
  };

  const confirmDeleteAccount = () => {
    Alert.alert('Delete account?', 'This permanently deletes your account and ALL data. Cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete forever', style: 'destructive',
        onPress: () => Alert.alert('Are you absolutely sure?', 'Last chance.', [
          { text: 'Keep my account', style: 'cancel' },
          { text: 'Yes, delete everything', style: 'destructive', onPress: () => run('delete', async () => { await deleteAccount(); await logout(); }, 'Deletion failed') },
        ]),
      },
    ]);
  };

  const hskBadge = stats ? computeHskBadge(stats.hskDistribution ?? {}) : null;
  const themeLabel = mode === 'light' ? 'Light' : mode === 'dark' ? 'Dark' : 'System';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.content}>

        {/* Avatar + name + badges */}
        <View style={styles.heroSection}>
          <Pressable onPress={pickAvatar} style={styles.avatarWrapper}>
            <View style={[styles.avatarRing, { borderColor: colors.primary, backgroundColor: colors.primaryContainer }]}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={[styles.avatarText, { color: colors.onPrimaryContainer }]}>{initials}</Text>
              )}
            </View>
            <View style={[styles.cameraBadge, { backgroundColor: colors.primary }]}>
              {busy === 'avatar'
                ? <MaterialIcons name="hourglass-empty" size={12} color={colors.onPrimary} />
                : <MaterialIcons name="photo-camera" size={12} color={colors.onPrimary} />}
            </View>
          </Pressable>

          <Pressable style={styles.nameRow} onPress={() => setNameModalOpen(true)}>
            <Text style={[styles.nameText, { color: colors.onSurface }]}>{displayName ?? user.email ?? '—'}</Text>
            <Icon name="edit" size={16} color={colors.outline} />
          </Pressable>

          <View style={styles.badgeRow}>
            {hskBadge && (
              <View style={[styles.badge, { backgroundColor: colors.primaryContainer }]}>
                <Text style={[typography.label, { fontSize: 11, color: colors.onPrimaryContainer }]}>{hskBadge}</Text>
              </View>
            )}
            {stats && stats.learnedWords >= 5 && (
              <View style={[styles.badge, { backgroundColor: colors.primaryContainer }]}>
                <Text style={[typography.label, { fontSize: 11, color: colors.onPrimaryContainer }]}>Calligrapher</Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats row — shows skeleton until data arrives */}
        <View style={styles.statsRow}>
          {stats ? (
            <>
              <View style={[styles.statCard, { backgroundColor: colors.surface, ...makeShadow(colors, 'card') }]}>
                <Text style={[styles.statValue, { color: colors.onSurface }]}>{stats.learnedWords.toLocaleString()}</Text>
                <Text style={[typography.label, { fontSize: 11, color: colors.outline }]}>Characters Mastered</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.surface, ...makeShadow(colors, 'card') }]}>
                <Text style={[styles.statValue, { color: colors.onSurface }]}>{stats.currentStreak}</Text>
                <Text style={[typography.label, { fontSize: 11, color: colors.outline }]}>Day Streak</Text>
              </View>
            </>
          ) : (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          )}
        </View>

        {/* Premium section */}
        <Text style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>Subscription</Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          {isPremiumUser ? (
            <View style={styles.settingRow}>
              <View style={[styles.settingIcon, { backgroundColor: '#b8860b22' }]}>
                <Text style={{ fontSize: 16 }}>👑</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typography.label, { color: colors.onSurface }]}>Premium Active</Text>
                <Text style={[typography.body, { fontSize: 12, color: colors.outline }]}>All features unlocked</Text>
              </View>
              <MaterialIcons name="check-circle" size={20} color={colors.primary} />
            </View>
          ) : (
            <Pressable
              style={styles.settingRow}
              onPress={() => router.push('/premium' as never)}
            >
              <View style={[styles.settingIcon, { backgroundColor: colors.primarySoft }]}>
                <Text style={{ fontSize: 16 }}>👑</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typography.label, { color: colors.primary }]}>Upgrade to Premium</Text>
                <Text style={[typography.body, { fontSize: 12, color: colors.outline }]}>Unlimited analyses · all quizzes · games</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.primary} />
            </Pressable>
          )}
          <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />
          <SettingRow
            icon="card-giftcard"
            label="Redeem Promo Code"
            onPress={async () => {
              if (Platform.OS === 'ios') {
                // Native iOS code redemption sheet
                await Purchases.presentCodeRedemptionSheet();
                await refreshPremium();
              } else {
                // Android: show alert with instructions — Play Store handles codes in-store
                Alert.alert(
                  'Redeem Promo Code',
                  'On Android, promo codes are redeemed through the Google Play Store.\n\n1. Open Google Play Store\n2. Tap your profile icon\n3. Go to Payments & subscriptions → Redeem gift code',
                  [{ text: 'OK' }]
                );
              }
            }}
            colors={colors}
          />
        </View>

        {/* Preferences section */}
        <Text style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>Preferences</Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <SettingRow
            icon="notifications-none"
            label="Notification Preferences"
            onPress={() => router.push('/notification-settings')}
            colors={colors}
          />
          <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />
          <SettingRow
            icon="brightness-medium"
            label="App Theme"
            value={themeLabel}
            onPress={() => setThemeModalOpen(true)}
            colors={colors}
          />
          <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />
          <SettingRow
            icon="ios-share"
            label={busy === 'anki' ? 'Preparing…' : 'Export Data'}
            onPress={() => run('anki', exportVocabularyToAnki, 'Export failed')}
            colors={colors}
          />
          <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />
          <SettingRow
            icon="privacy-tip"
            label="Privacy Policy"
            onPress={() => WebBrowser.openBrowserAsync(`${process.env.EXPO_PUBLIC_API_URL}/privacy`)}
            colors={colors}
          />
        </View>

        {/* Account section */}
        <Text style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>Account</Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <SettingRow
            icon="logout"
            label="Log Out"
            onPress={logout}
            danger
            colors={colors}
          />
          <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />
          <SettingRow
            icon="delete-outline"
            label={busy === 'delete' ? 'Deleting…' : 'Delete Account & Data'}
            onPress={confirmDeleteAccount}
            danger
            colors={colors}
          />
        </View>

      </ScrollView>

      <TextInputModal
        visible={nameModalOpen}
        title="Display name"
        message="How should we call you?"
        initialValue={displayName ?? ''}
        onSubmit={submitName}
        onCancel={() => setNameModalOpen(false)}
      />

      {themeModalOpen && (
        <ThemePicker mode={mode} setMode={setMode} onClose={() => setThemeModalOpen(false)} colors={colors} />
      )}
    </View>
  );
}

function SettingRow({
  icon, label, value, onPress, danger, colors,
}: {
  icon: Parameters<typeof Icon>[0]['name'];
  label: string;
  value?: string;
  onPress: () => void;
  danger?: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <Pressable style={styles.settingRow} onPress={onPress}>
      <Icon name={icon} size={20} color={danger ? colors.error : colors.onSurfaceVariant} />
      <Text style={[typography.body, { flex: 1, color: danger ? colors.error : colors.onSurface }]}>{label}</Text>
      {value && <Text style={[typography.label, { fontSize: 13, color: colors.outline }]}>{value}</Text>}
      <MaterialIcons name="chevron-right" size={20} color={danger ? colors.error : colors.outline} />
    </Pressable>
  );
}

function ThemePicker({
  mode, setMode, onClose, colors,
}: {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  onClose: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const opts: { value: ThemeMode; label: string }[] = [
    { value: 'system', label: 'System' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
  ];
  return (
    <Pressable style={styles.modalBackdrop} onPress={onClose}>
      <View style={[styles.themeSheet, { backgroundColor: colors.surface }]}>
        <Text style={[typography.heading, { color: colors.onSurface, marginBottom: spacing.md }]}>App Theme</Text>
        {opts.map((o) => {
          const active = mode === o.value;
          return (
            <Pressable
              key={o.value}
              style={[styles.themeOption, active && { backgroundColor: colors.primarySoft }]}
              onPress={() => { setMode(o.value); onClose(); }}
            >
              <Text style={[typography.body, { color: active ? colors.primary : colors.onSurface }]}>{o.label}</Text>
              {active && <MaterialIcons name="check" size={18} color={colors.primary} />}
            </Pressable>
          );
        })}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 120 },
  heroSection: { alignItems: 'center', paddingTop: spacing.xl, paddingBottom: spacing.lg },
  avatarWrapper: { position: 'relative', width: 100, height: 100 },
  avatarRing: {
    width: 100, height: 100, borderRadius: 50, borderWidth: 3,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarImage: { width: 94, height: 94, borderRadius: 47 },
  avatarText: { fontFamily: fonts.headlineSemi, fontSize: 32 },
  cameraBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.md },
  nameText: { fontFamily: fonts.headlineSemi, fontSize: 22 },
  badgeRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  badge: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  statsRow: {
    flexDirection: 'row', gap: spacing.md,
    marginHorizontal: spacing.containerMargin, marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', gap: 4,
  },
  statValue: { fontFamily: fonts.headlineSemi, fontSize: 28 },
  sectionLabel: {
    ...typography.label, fontSize: 12,
    marginHorizontal: spacing.containerMargin,
    marginBottom: spacing.xs, marginTop: spacing.md,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  section: {
    marginHorizontal: spacing.containerMargin,
    borderRadius: radius.lg, overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.md, padding: spacing.md,
  },
  settingIcon: {
    width: 36, height: 36, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: spacing.md + 20 + spacing.md },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject, backgroundColor: '#00000066',
    justifyContent: 'flex-end',
  },
  themeSheet: {
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    padding: spacing.xl, paddingBottom: spacing.xl + 20,
  },
  themeOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.md, paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
});
