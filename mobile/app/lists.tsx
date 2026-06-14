import { useCallback, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, FlatList, ActivityIndicator, TextInput, Modal, Alert,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { fetchLists, createList, deleteList, VocabularyList } from '../src/lib/library-service';
import { useTheme } from '../src/theme/theme-context';
import { spacing, radius, typography, fonts, makeShadow } from '../src/theme/theme';
import { Icon } from '../src/theme/ui-primitives';

const COLORS = ['#2d6a4f', '#3b82f6', '#d9a14a', '#ba181b', '#8b7fd9', '#0f766e'];

export default function ListsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [lists, setLists] = useState<VocabularyList[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try { setLists(await fetchLists()); } catch { /* keep prior */ } finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await createList(newName.trim(), newColor);
      setModalOpen(false); setNewName(''); setNewColor(COLORS[0]);
      await load();
    } catch (err) {
      Alert.alert('Create failed', err instanceof Error ? err.message : 'Try again');
    } finally { setCreating(false); }
  };

  const confirmDelete = (list: VocabularyList) => {
    Alert.alert('Delete list', `Delete "${list.name}"? Words stay in your vocabulary.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try { await deleteList(list.id); setLists((prev) => prev.filter((l) => l.id !== list.id)); }
          catch { Alert.alert('Delete failed', 'Try again'); }
        },
      },
    ]);
  };

  if (loading) {
    return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={lists}
        keyExtractor={(l) => l.id}
        contentContainerStyle={{ padding: spacing.containerMargin, paddingBottom: 120 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 80 }}>
            <Icon name="folder-open" size={44} color={colors.outline} />
            <Text style={[typography.body, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.md }]}>
              No lists yet. Create one to organize your words.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, { backgroundColor: colors.surface, ...makeShadow(colors, 'card') }]}
            onPress={() => router.push({ pathname: '/list-detail', params: { id: item.id, name: item.name } })}
            onLongPress={() => confirmDelete(item)}
          >
            <View style={[styles.colorDot, { backgroundColor: item.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={[typography.heading, { color: colors.onSurface }]}>{item.name}</Text>
              <Text style={[typography.pinyin, { color: colors.outline, marginTop: 2 }]}>
                {item.wordCount} words · {item.learnedCount} learned
              </Text>
            </View>
            <Icon name="chevron-right" size={24} color={colors.outline} />
          </Pressable>
        )}
      />

      <Pressable
        style={({ pressed }) => [styles.fab, { backgroundColor: colors.primaryContainer, ...makeShadow(colors, 'jade') }, pressed && { transform: [{ scale: 0.96 }] }]}
        onPress={() => setModalOpen(true)}
      >
        <Icon name="add" size={20} color={colors.onPrimaryContainer} />
        <Text style={[typography.label, { fontSize: 14, color: colors.onPrimaryContainer }]}>New List</Text>
      </Pressable>

      <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.backdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text style={[typography.heading, { color: colors.onSurface }]}>New List</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.onSurface, borderColor: colors.outlineVariant, fontFamily: fonts.body }]}
              placeholder="List name"
              placeholderTextColor={colors.outline}
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            <View style={styles.colorRow}>
              {COLORS.map((c) => (
                <Pressable
                  key={c}
                  style={[styles.colorChoice, { backgroundColor: c, borderColor: newColor === c ? colors.onSurface : 'transparent' }]}
                  onPress={() => setNewColor(c)}
                />
              ))}
            </View>
            <View style={styles.modalActions}>
              <Pressable onPress={() => setModalOpen(false)}>
                <Text style={[typography.label, { fontSize: 14, color: colors.onSurfaceVariant }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.createBtn, { backgroundColor: colors.primaryContainer }, !newName.trim() && { opacity: 0.5 }]}
                onPress={handleCreate}
                disabled={!newName.trim() || creating}
              >
                <Text style={[typography.label, { fontSize: 14, color: colors.onPrimaryContainer }]}>{creating ? 'Creating…' : 'Create'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm },
  colorDot: { width: 14, height: 14, borderRadius: 7 },
  fab: { position: 'absolute', bottom: 24, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radius.pill, paddingVertical: 14, paddingHorizontal: spacing.lg },
  backdrop: { flex: 1, backgroundColor: '#000000aa', justifyContent: 'center', padding: spacing.lg },
  modalCard: { borderRadius: radius.lg, padding: spacing.lg },
  input: { borderRadius: radius.md, padding: spacing.md, borderWidth: 1, marginTop: spacing.md, marginBottom: spacing.md },
  colorRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  colorChoice: { width: 32, height: 32, borderRadius: 16, borderWidth: 2 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: spacing.lg },
  createBtn: { borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: spacing.lg },
});
