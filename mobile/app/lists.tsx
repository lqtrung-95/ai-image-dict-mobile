import { useCallback, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator,
  TextInput, Modal, Alert,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  fetchLists, createList, deleteList, VocabularyList,
} from '../src/lib/library-service';

const COLORS = ['#a855f7', '#3b82f6', '#22c55e', '#f97316', '#ef4444', '#eab308'];

export default function ListsScreen() {
  const router = useRouter();
  const [lists, setLists] = useState<VocabularyList[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      setLists(await fetchLists());
    } catch {
      // keep prior list on transient error
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh on focus so new words/lists show after navigating back
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await createList(newName.trim(), newColor);
      setModalOpen(false);
      setNewName('');
      setNewColor(COLORS[0]);
      await load();
    } catch (err) {
      Alert.alert('Create failed', err instanceof Error ? err.message : 'Try again');
    } finally {
      setCreating(false);
    }
  };

  const confirmDelete = (list: VocabularyList) => {
    Alert.alert('Delete list', `Delete "${list.name}"? Words stay in your vocabulary.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteList(list.id);
            setLists((prev) => prev.filter((l) => l.id !== list.id));
          } catch {
            Alert.alert('Delete failed', 'Try again');
          }
        },
      },
    ]);
  };

  if (loading) {
    return <View style={[styles.container, styles.centered]}><ActivityIndicator size="large" color="#a855f7" /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={lists}
        keyExtractor={(l) => l.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🗂</Text>
            <Text style={styles.emptyText}>No lists yet. Create one to organize your words.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push({ pathname: '/list-detail', params: { id: item.id, name: item.name } })}
            onLongPress={() => confirmDelete(item)}
          >
            <View style={[styles.colorDot, { backgroundColor: item.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.listName}>{item.name}</Text>
              <Text style={styles.listMeta}>
                {item.wordCount} words · {item.learnedCount} learned
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalOpen(true)}>
        <Text style={styles.fabText}>+ New List</Text>
      </TouchableOpacity>

      <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New List</Text>
            <TextInput
              style={styles.input}
              placeholder="List name"
              placeholderTextColor="#64748b"
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            <View style={styles.colorRow}>
              {COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorChoice, { backgroundColor: c }, newColor === c && styles.colorChoiceActive]}
                  onPress={() => setNewColor(c)}
                />
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createButton, !newName.trim() && styles.disabled]}
                onPress={handleCreate}
                disabled={!newName.trim() || creating}
              >
                <Text style={styles.createButtonText}>{creating ? 'Creating…' : 'Create'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: '#94a3b8', textAlign: 'center', paddingHorizontal: 32 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#1e293b',
    borderRadius: 12, padding: 16, marginBottom: 10,
  },
  colorDot: { width: 14, height: 14, borderRadius: 7 },
  listName: { color: '#fff', fontSize: 17, fontWeight: '600' },
  listMeta: { color: '#94a3b8', fontSize: 13, marginTop: 2 },
  chevron: { color: '#64748b', fontSize: 24 },
  fab: {
    position: 'absolute', bottom: 24, alignSelf: 'center',
    backgroundColor: '#9333ea', borderRadius: 28, paddingVertical: 14, paddingHorizontal: 28,
  },
  fabText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  modalBackdrop: { flex: 1, backgroundColor: '#000000aa', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 16 },
  input: {
    backgroundColor: '#0f172a', borderRadius: 10, padding: 14, color: '#fff',
    borderWidth: 1, borderColor: '#334155', marginBottom: 16,
  },
  colorRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  colorChoice: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: 'transparent' },
  colorChoiceActive: { borderColor: '#fff' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 20 },
  cancelText: { color: '#94a3b8', fontSize: 15 },
  createButton: { backgroundColor: '#9333ea', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20 },
  createButtonText: { color: '#fff', fontWeight: '600' },
  disabled: { opacity: 0.5 },
});
