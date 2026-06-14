import { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, Image, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchHistory, createStory, HistoryAnalysis } from '../src/lib/library-service';
import { useTheme } from '../src/theme/theme-context';
import { spacing, radius, typography, fonts } from '../src/theme/theme';
import { Icon } from '../src/theme/ui-primitives';

export default function StoryCreateScreen() {
  const router = useRouter();
  const { colors } = useTheme();
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
    return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  const inputStyle = { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, color: colors.onSurface, borderWidth: 1, borderColor: colors.outlineVariant, marginBottom: spacing.sm, fontFamily: fonts.body };

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.background }}
      data={photos}
      keyExtractor={(p) => p.id}
      numColumns={3}
      contentContainerStyle={{ padding: spacing.sm }}
      columnWrapperStyle={{ gap: spacing.xs }}
      ListHeaderComponent={
        <View>
          <TextInput style={inputStyle} placeholder="Story title" placeholderTextColor={colors.outline} value={title} onChangeText={setTitle} />
          <TextInput style={[inputStyle, { height: 70 }]} placeholder="Description (optional)" placeholderTextColor={colors.outline} value={description} onChangeText={setDescription} multiline />
          <Text style={[typography.heading, { fontSize: 15, color: colors.onSurface, marginBottom: spacing.sm }]}>Select photos ({selected.size} chosen)</Text>
          {photos.length === 0 && <Text style={[typography.body, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.lg }]}>No photos to add. Capture some first!</Text>}
        </View>
      }
      renderItem={({ item }) => {
        const isSel = selected.has(item.id);
        return (
          <Pressable style={styles.photoWrap} onPress={() => toggle(item.id)}>
            <Image source={{ uri: item.image_url }} style={styles.photo} />
            {isSel && <View style={[styles.checkOverlay, { backgroundColor: 'rgba(45,106,79,0.7)' }]}><Icon name="check" size={28} color="#fff" /></View>}
          </Pressable>
        );
      }}
      ListFooterComponent={
        photos.length > 0 ? (
          <Pressable
            style={[styles.createBtn, { backgroundColor: colors.primaryContainer }, (saving || !title.trim() || selected.size === 0) && { opacity: 0.5 }]}
            onPress={handleCreate}
            disabled={saving || !title.trim() || selected.size === 0}
          >
            <Text style={[typography.label, { fontSize: 15, color: colors.onPrimaryContainer }]}>{saving ? 'Creating…' : 'Create Story'}</Text>
          </Pressable>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  photoWrap: { flex: 1 / 3, aspectRatio: 1, marginBottom: spacing.xs, borderRadius: radius.md, overflow: 'hidden' },
  photo: { width: '100%', height: '100%' },
  checkOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  createBtn: { borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md, alignItems: 'center' },
});
