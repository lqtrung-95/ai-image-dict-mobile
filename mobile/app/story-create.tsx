import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, FlatList, Image, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  fetchHistory, createStory, HistoryAnalysis,
} from '../src/lib/library-service';

export default function StoryCreateScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<HistoryAnalysis[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchHistory().then(setPhotos).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!title.trim()) { Alert.alert('Title required', 'Please name your story.'); return; }
    if (selected.size === 0) { Alert.alert('Select photos', 'Pick at least one photo.'); return; }
    setSaving(true);
    try {
      await createStory(title.trim(), description.trim(), Array.from(selected));
      router.back();
    } catch (err) {
      Alert.alert('Create failed', err instanceof Error ? err.message : 'Try again');
      setSaving(false);
    }
  };

  if (loading) {
    return <View style={[styles.container, styles.centered]}><ActivityIndicator size="large" color="#a855f7" /></View>;
  }

  return (
    <FlatList
      style={styles.container}
      data={photos}
      keyExtractor={(p) => p.id}
      numColumns={3}
      contentContainerStyle={{ padding: 12 }}
      columnWrapperStyle={{ gap: 8 }}
      ListHeaderComponent={
        <View>
          <TextInput
            style={styles.input}
            placeholder="Story title"
            placeholderTextColor="#64748b"
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={[styles.input, { height: 70 }]}
            placeholder="Description (optional)"
            placeholderTextColor="#64748b"
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <Text style={styles.label}>
            Select photos ({selected.size} chosen)
          </Text>
          {photos.length === 0 && (
            <Text style={styles.empty}>No photos to add. Capture some first!</Text>
          )}
        </View>
      }
      renderItem={({ item }) => {
        const isSel = selected.has(item.id);
        return (
          <TouchableOpacity style={styles.photoWrap} onPress={() => toggle(item.id)}>
            <Image source={{ uri: item.image_url }} style={styles.photo} />
            {isSel && <View style={styles.checkOverlay}><Text style={styles.check}>✓</Text></View>}
          </TouchableOpacity>
        );
      }}
      ListFooterComponent={
        photos.length > 0 ? (
          <TouchableOpacity
            style={[styles.createButton, (saving || !title.trim() || selected.size === 0) && styles.disabled]}
            onPress={handleCreate}
            disabled={saving || !title.trim() || selected.size === 0}
          >
            <Text style={styles.createText}>{saving ? 'Creating…' : 'Create Story'}</Text>
          </TouchableOpacity>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  input: {
    backgroundColor: '#1e293b', borderRadius: 10, padding: 14, color: '#fff',
    borderWidth: 1, borderColor: '#334155', marginBottom: 12,
  },
  label: { color: '#e2e8f0', fontSize: 15, fontWeight: '600', marginBottom: 10 },
  empty: { color: '#94a3b8', textAlign: 'center', marginTop: 24 },
  photoWrap: { flex: 1 / 3, aspectRatio: 1, marginBottom: 8, borderRadius: 8, overflow: 'hidden' },
  photo: { width: '100%', height: '100%' },
  checkOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: '#9333eaaa',
    justifyContent: 'center', alignItems: 'center',
  },
  check: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  createButton: {
    backgroundColor: '#9333ea', borderRadius: 12, padding: 16, marginTop: 16,
  },
  createText: { color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 16 },
  disabled: { opacity: 0.5 },
});
