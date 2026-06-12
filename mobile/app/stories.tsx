import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { fetchStories, deleteStory, PhotoStory } from '../src/lib/library-service';

export default function StoriesScreen() {
  const router = useRouter();
  const [stories, setStories] = useState<PhotoStory[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setStories(await fetchStories());
    } catch {
      // keep prior
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const confirmDelete = (story: PhotoStory) => {
    Alert.alert('Delete story', `Delete "${story.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteStory(story.id);
            setStories((prev) => prev.filter((s) => s.id !== story.id));
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
        data={stories}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📖</Text>
            <Text style={styles.emptyText}>No stories yet. Group your photos into a story!</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push({ pathname: '/story-detail', params: { id: item.id } })}
            onLongPress={() => confirmDelete(item)}
          >
            {item.cover_image_url ? (
              <Image source={{ uri: item.cover_image_url }} style={styles.cover} />
            ) : (
              <View style={[styles.cover, styles.coverPlaceholder]}>
                <Text style={{ fontSize: 32 }}>📖</Text>
              </View>
            )}
            <View style={styles.cardBody}>
              <Text style={styles.title}>{item.title}</Text>
              {item.description ? <Text style={styles.desc} numberOfLines={2}>{item.description}</Text> : null}
              <Text style={styles.meta}>{item.photoCount} photos</Text>
            </View>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/story-create')}>
        <Text style={styles.fabText}>+ New Story</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: '#94a3b8', textAlign: 'center', paddingHorizontal: 32 },
  card: { backgroundColor: '#1e293b', borderRadius: 14, marginBottom: 14, overflow: 'hidden' },
  cover: { width: '100%', height: 150 },
  coverPlaceholder: { backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  cardBody: { padding: 14 },
  title: { color: '#fff', fontSize: 18, fontWeight: '600' },
  desc: { color: '#94a3b8', fontSize: 13, marginTop: 4 },
  meta: { color: '#64748b', fontSize: 12, marginTop: 8 },
  fab: {
    position: 'absolute', bottom: 24, alignSelf: 'center',
    backgroundColor: '#9333ea', borderRadius: 28, paddingVertical: 14, paddingHorizontal: 28,
  },
  fabText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
