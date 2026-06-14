import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/lib/auth-context';
import { exportVocabularyToAnki } from '../../src/lib/anki-export-service';
import { TextInputModal } from '../../src/components/text-input-modal';
import { fetchProfile, updateDisplayName, exportAllUserData, deleteAccount } from '../../src/lib/user-settings-service';
import { Screen, Eyebrow, Icon, AppButton } from '../../src/theme/ui-primitives';
import { useTheme, ThemeMode } from '../../src/theme/theme-context';
import { spacing, radius, typography } from '../../src/theme/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { colors, mode, setMode } = useTheme();
  const router = useRouter();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [nameModalOpen, setNameModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      fetchProfile().then((p) => setDisplayName(p.display_name)).catch(() => {});
    }
  }, [user]);

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg }}>
          <Icon name="person" size={40} color={colors.primary} />
        </View>
        <Text style={[typography.headline, { color: colors.onSurface, marginBottom: spacing.xs }]}>Browsing as guest</Text>
        <Text style={[typography.body, { color: colors.onSurfaceVariant, textAlign: 'center', marginBottom: spacing.lg }]}>
          Log in to save vocabulary, track progress, and sync across devices.
        </Text>
        <AppButton label="Log in / Sign up" onPress={() => router.push('/(auth)/login')} />
        <View style={{ marginTop: spacing.xl, width: '100%' }}>
          <AppearanceToggle mode={mode} setMode={setMode} />
        </View>
      </View>
    );
  }

  const run = async (key: string, fn: () => Promise<void>, errTitle: string) => {
    setBusy(key);
    try { await fn(); } catch (err) { Alert.alert(errTitle, err instanceof Error ? err.message : 'Try again'); } finally { setBusy(null); }
  };

  const submitName = async (name: string) => {
    setNameModalOpen(false);
    await run('name', async () => { await updateDisplayName(name); setDisplayName(name); }, 'Update failed');
  };

  const confirmDeleteAccount = () => {
    Alert.alert('Delete account?', 'This permanently deletes your account and ALL data — vocabulary, photos, progress. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete forever', style: 'destructive',
        onPress: () => Alert.alert('Are you absolutely sure?', 'Last chance to keep your data.', [
          { text: 'Keep my account', style: 'cancel' },
          { text: 'Yes, delete everything', style: 'destructive', onPress: () => run('delete', async () => { await deleteAccount(); await logout(); }, 'Deletion failed') },
        ]),
      },
    ]);
  };

  const actionRow = (icon: Parameters<typeof Icon>[0]['name'], label: string, onPress: () => void, danger?: boolean) => (
    <Pressable
      style={[styles.row, { backgroundColor: colors.surface, borderColor: danger ? colors.error : colors.outlineVariant }]}
      onPress={onPress}
      disabled={busy !== null}
    >
      <Icon name={icon} size={20} color={danger ? colors.error : colors.primary} />
      <Text style={[typography.body, { color: danger ? colors.error : colors.onSurface, flex: 1 }]}>{label}</Text>
      <Icon name="chevron-right" size={20} color={colors.outline} />
    </Pressable>
  );

  return (
    <Screen scroll contentStyle={{ paddingBottom: 120 }}>
      <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }} onPress={() => setNameModalOpen(true)}>
        <Text style={[typography.headline, { color: colors.onSurface }]}>{displayName ?? '—'}</Text>
        <Icon name="edit" size={18} color={colors.outline} />
      </Pressable>
      <Text style={[typography.body, { color: colors.onSurfaceVariant, marginTop: 2 }]}>{user.email}</Text>

      <TextInputModal
        visible={nameModalOpen}
        title="Display name"
        message="How should we call you?"
        initialValue={displayName ?? ''}
        onSubmit={submitName}
        onCancel={() => setNameModalOpen(false)}
      />

      <Eyebrow style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>Appearance</Eyebrow>
      <AppearanceToggle mode={mode} setMode={setMode} />

      <Eyebrow style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>Data</Eyebrow>
      <View style={{ gap: spacing.sm }}>
        {actionRow('ios-share', busy === 'anki' ? 'Preparing…' : 'Export vocabulary to Anki', () => run('anki', exportVocabularyToAnki, 'Export failed'))}
        {actionRow('download', busy === 'export' ? 'Preparing…' : 'Download all my data (JSON)', () => run('export', exportAllUserData, 'Export failed'))}
      </View>

      <Eyebrow style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>Account</Eyebrow>
      <View style={{ gap: spacing.sm }}>
        {actionRow('logout', 'Log Out', logout)}
        {actionRow('delete-outline', busy === 'delete' ? 'Deleting…' : 'Delete account & all data', confirmDeleteAccount, true)}
      </View>
    </Screen>
  );
}

function AppearanceToggle({ mode, setMode }: { mode: ThemeMode; setMode: (m: ThemeMode) => void }) {
  const { colors } = useTheme();
  const opts: { value: ThemeMode; label: string }[] = [
    { value: 'system', label: 'System' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
  ];
  return (
    <View style={[styles.segment, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
      {opts.map((o) => {
        const active = mode === o.value;
        return (
          <Pressable key={o.value} style={[styles.segmentItem, active && { backgroundColor: colors.primarySoft }]} onPress={() => setMode(o.value)}>
            <Text style={[typography.label, { fontSize: 13, color: active ? colors.primary : colors.onSurfaceVariant }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.md, padding: spacing.md, borderWidth: 1 },
  segment: { flexDirection: 'row', borderRadius: radius.md, borderWidth: 1, padding: 4 },
  segmentItem: { flex: 1, paddingVertical: 10, borderRadius: radius.sm, alignItems: 'center' },
});
