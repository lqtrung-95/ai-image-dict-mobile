import { useEffect, useState } from 'react';
import {
  ScrollView, Text, TouchableOpacity, StyleSheet, Alert, Platform, View,
} from 'react-native';
import { fetchLists, createList, VocabularyList } from '../lib/library-service';

interface Props {
  selectedListId: string | null;
  onSelect: (listId: string | null) => void;
}

// Horizontal chip row to pick a target list when saving words.
// Shown on the analysis result screen so users can organize immediately.
export function ListPickerRow({ selectedListId, onSelect }: Props) {
  const [lists, setLists] = useState<VocabularyList[]>([]);

  useEffect(() => {
    fetchLists().then(setLists).catch(() => {});
  }, []);

  const promptNewList = () => {
    if (Platform.OS === 'ios') {
      Alert.prompt('New List', 'Name your list', async (name) => {
        if (!name?.trim()) return;
        try {
          const created = await createList(name.trim(), '#a855f7');
          setLists((prev) => [created, ...prev]);
          onSelect(created.id);
        } catch {
          Alert.alert('Create failed', 'Try again');
        }
      });
    } else {
      Alert.alert('New List', 'Create lists from the Lists screen on Android for now.');
    }
  };

  return (
    <View>
      <Text style={styles.label}>Save words to list (optional)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <TouchableOpacity
          style={[styles.chip, selectedListId === null && styles.chipActive]}
          onPress={() => onSelect(null)}
        >
          <Text style={styles.chipText}>No list</Text>
        </TouchableOpacity>
        {lists.map((list) => (
          <TouchableOpacity
            key={list.id}
            style={[styles.chip, selectedListId === list.id && styles.chipActive]}
            onPress={() => onSelect(list.id)}
          >
            <View style={[styles.dot, { backgroundColor: list.color }]} />
            <Text style={styles.chipText}>{list.name}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.chip} onPress={promptNewList}>
          <Text style={[styles.chipText, { color: '#a855f7' }]}>+ New</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: '#94a3b8', fontSize: 13, marginBottom: 8 },
  row: { gap: 8, paddingBottom: 4 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#1e293b', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14,
    borderWidth: 1, borderColor: '#334155',
  },
  chipActive: { borderColor: '#a855f7', backgroundColor: '#9333ea22' },
  chipText: { color: '#e2e8f0', fontSize: 13 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
