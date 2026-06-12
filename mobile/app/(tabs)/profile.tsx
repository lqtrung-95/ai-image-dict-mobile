import { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/lib/auth-context';
import { exportVocabularyToAnki } from '../../src/lib/anki-export-service';
import { TextInputModal } from '../../src/components/text-input-modal';
import {
  fetchProfile, updateDisplayName, exportAllUserData, deleteAccount,
} from '../../src/lib/user-settings-service';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
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
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.emoji}>👤</Text>
        <Text style={styles.guestTitle}>You're browsing as a guest</Text>
        <Text style={styles.guestSubtitle}>
          Log in to save vocabulary, track progress, and sync across devices.
        </Text>
        <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.loginButtonText}>Log In / Sign Up</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const run = async (key: string, fn: () => Promise<void>, errTitle: string) => {
    setBusy(key);
    try {
      await fn();
    } catch (err) {
      Alert.alert(errTitle, err instanceof Error ? err.message : 'Try again');
    } finally {
      setBusy(null);
    }
  };

  const submitName = async (name: string) => {
    setNameModalOpen(false);
    await run('name', async () => {
      await updateDisplayName(name);
      setDisplayName(name);
    }, 'Update failed');
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Delete account?',
      'This permanently deletes your account and ALL data — vocabulary, photos, progress. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete forever',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Are you absolutely sure?', 'Last chance to keep your data.', [
              { text: 'Keep my account', style: 'cancel' },
              {
                text: 'Yes, delete everything',
                style: 'destructive',
                onPress: () =>
                  run('delete', async () => {
                    await deleteAccount();
                    await logout();
                  }, 'Deletion failed'),
              },
            ]),
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24 }}>
      <TouchableOpacity onPress={() => setNameModalOpen(true)}>
        <Text style={styles.name}>{displayName ?? '—'} <Text style={styles.editHint}>✏️</Text></Text>
      </TouchableOpacity>

      <TextInputModal
        visible={nameModalOpen}
        title="Display name"
        message="How should we call you?"
        placeholder="Your name"
        initialValue={displayName ?? ''}
        onSubmit={submitName}
        onCancel={() => setNameModalOpen(false)}
      />
      <Text style={styles.email}>{user.email}</Text>

      <Text style={styles.sectionLabel}>Data</Text>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => run('anki', exportVocabularyToAnki, 'Export failed')}
        disabled={busy !== null}
      >
        <Text style={styles.actionText}>
          {busy === 'anki' ? 'Preparing export…' : '📤 Export vocabulary to Anki'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => run('export', exportAllUserData, 'Export failed')}
        disabled={busy !== null}
      >
        <Text style={styles.actionText}>
          {busy === 'export' ? 'Preparing export…' : '📦 Download all my data (JSON)'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.sectionLabel}>Account</Text>
      <TouchableOpacity style={styles.logoutButton} onPress={logout} disabled={busy !== null}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={confirmDeleteAccount}
        disabled={busy !== null}
      >
        <Text style={styles.deleteText}>
          {busy === 'delete' ? 'Deleting…' : 'Delete account & all data'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  centered: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  emoji: { fontSize: 40, marginBottom: 16 },
  guestTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  guestSubtitle: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginBottom: 24 },
  loginButton: { backgroundColor: '#9333ea', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 },
  loginButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  name: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  editHint: { fontSize: 14 },
  email: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  sectionLabel: {
    color: '#64748b', fontSize: 12, fontWeight: '700', textTransform: 'uppercase',
    marginTop: 28, marginBottom: 10, letterSpacing: 1,
  },
  actionButton: {
    backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: '#334155',
  },
  actionText: { color: '#e2e8f0', fontWeight: '600' },
  logoutButton: {
    backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: '#475569',
  },
  logoutText: { color: '#e2e8f0', textAlign: 'center', fontWeight: '600' },
  deleteButton: {
    backgroundColor: '#1e293b', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#ef4444',
  },
  deleteText: { color: '#ef4444', textAlign: 'center', fontWeight: '600' },
});
