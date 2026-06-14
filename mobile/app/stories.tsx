import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { fetchStories, deleteStory, PhotoStory } from '../src/lib/library-service';
import { useTheme } from '../src/theme/theme-context';
import { spacing, radius, typography, makeShadow } from '../src/theme/theme';
import { Icon } from '../src/theme/ui-primitives';

export default function StoriesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
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
    return <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={stories}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ padding: spacing.containerMargin, paddingBottom: 120 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 80 }}>
            <Icon name="auto-stories" size={44} color={colors.outline} />
            <Text style={[typography.body, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.md }]}>No stories yet. Group your photos into a story!</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, { backgroundColor: colors.surface, ...makeShadow(colors, 'card') }]}
            onPress={() => router.push({ pathname: '/story-detail', params: { id: item.id } })}
            onLongPress={() => confirmDelete(item)}
          >
            {item.cover_image_url ? (
              <Image source={{ uri: item.cover_image_url }} style={styles.cover} />
            ) : (
              <View style={[styles.cover, { backgroundColor: colors.surfaceContainer, justifyContent: 'center', alignItems: 'center' }]}>
                <Icon name="auto-stories" size={32} color={colors.outline} />
              </View>
            )}
            <View style={{ padding: spacing.md }}>
              <Text style={[typography.heading, { color: colors.onSurface }]}>{item.title}</Text>
              {item.description ? <Text style={[typography.pinyin, { color: colors.onSurfaceVariant, marginTop: 4 }]} numberOfLines={2}>{item.description}</Text> : null}
              <Text style={[typography.label, { fontSize: 12, color: colors.outline, marginTop: spacing.sm }]}>{item.photoCount} photos</Text>
            </View>
          </Pressable>
        )}
      />
      <Pressable style={[styles.fab, { backgroundColor: colors.primaryContainer, ...makeShadow(colors, 'jade') }]} onPress={() => router.push('/story-create')}>
        <Icon name="add" size={20} color={colors.onPrimaryContainer} />
        <Text style={[typography.label, { fontSize: 14, color: colors.onPrimaryContainer }]}>New Story</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, marginBottom: spacing.md, overflow: 'hidden' },
  cover: { width: '100%', height: 150 },
  fab: { position: 'absolute', bottom: 24, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radius.pill, paddingVertical: 14, paddingHorizontal: spacing.lg },
});
