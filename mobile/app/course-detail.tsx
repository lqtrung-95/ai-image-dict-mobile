import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { speakChinese } from '../src/lib/tts-speech-service';
import {
  fetchCourseDetail, subscribeToCourse, unsubscribeFromCourse, rateCourse, CourseDetail,
} from '../src/lib/courses-service';

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [detail, setDetail] = useState<CourseDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    fetchCourseDetail(id)
      .then(setDetail)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (error) {
    return <View style={[styles.container, styles.centered]}><Text style={styles.error}>{error}</Text></View>;
  }
  if (!detail) {
    return <View style={[styles.container, styles.centered]}><ActivityIndicator size="large" color="#a855f7" /></View>;
  }

  const { course, words } = detail;
  const subscribed = detail.isSubscribed ?? course.isSubscribed ?? false;
  const myRating = detail.userRating?.rating ?? 0;

  const toggleSubscribe = async () => {
    setBusy(true);
    try {
      if (subscribed) await unsubscribeFromCourse(id);
      else await subscribeToCourse(id);
      load();
    } catch (err) {
      Alert.alert('Action failed', err instanceof Error ? err.message : 'Try again');
    } finally {
      setBusy(false);
    }
  };

  const handleRate = async (stars: number) => {
    try {
      await rateCourse(id, stars);
      load();
    } catch (err) {
      Alert.alert('Rating failed', err instanceof Error ? err.message : 'Try again');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <Stack.Screen options={{ title: course.name }} />

      <Text style={styles.name}>{course.name}</Text>
      {course.description ? <Text style={styles.desc}>{course.description}</Text> : null}
      <Text style={styles.meta}>
        HSK {course.difficultyLevel} · {course.wordCount} words · {course.subscriberCount} learners
        {course.ratingAvg != null ? ` · ★ ${course.ratingAvg.toFixed(1)}` : ''}
      </Text>

      <TouchableOpacity
        style={[styles.subscribeButton, subscribed && styles.unsubscribeButton]}
        onPress={toggleSubscribe}
        disabled={busy}
      >
        <Text style={styles.subscribeText}>
          {busy ? '…' : subscribed ? '✓ Subscribed — tap to unsubscribe' : 'Subscribe to this course'}
        </Text>
      </TouchableOpacity>

      {subscribed && (
        <View style={styles.rateRow}>
          <Text style={styles.rateLabel}>Your rating:</Text>
          {[1, 2, 3, 4, 5].map((s) => (
            <TouchableOpacity key={s} onPress={() => handleRate(s)}>
              <Text style={styles.star}>{s <= myRating ? '★' : '☆'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>Words ({words.length})</Text>
      {words.map((w) => (
        <TouchableOpacity key={w.id} style={styles.wordCard} onPress={() => speakChinese(w.word_zh)}>
          <View style={{ flex: 1 }}>
            <Text style={styles.wordZh}>{w.word_zh}</Text>
            <Text style={styles.wordPinyin}>{w.word_pinyin}</Text>
            <Text style={styles.wordEn}>{w.word_en}</Text>
            {w.example_sentence ? <Text style={styles.example}>{w.example_sentence}</Text> : null}
          </View>
          {w.hsk_level != null && (
            <View style={styles.hskBadge}><Text style={styles.hskText}>HSK {w.hsk_level}</Text></View>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  error: { color: '#f87171' },
  name: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  desc: { color: '#cbd5e1', fontSize: 14, marginTop: 8, lineHeight: 20 },
  meta: { color: '#64748b', fontSize: 13, marginTop: 8 },
  subscribeButton: {
    backgroundColor: '#9333ea', borderRadius: 12, padding: 16, marginTop: 16,
  },
  unsubscribeButton: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#4ade80' },
  subscribeText: { color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 15 },
  rateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  rateLabel: { color: '#94a3b8', fontSize: 14, marginRight: 4 },
  star: { color: '#eab308', fontSize: 26 },
  sectionTitle: { color: '#fff', fontSize: 17, fontWeight: '600', marginTop: 24, marginBottom: 12 },
  wordCard: {
    backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 10,
    flexDirection: 'row', alignItems: 'flex-start',
  },
  wordZh: { color: '#fff', fontSize: 20, fontWeight: '600' },
  wordPinyin: { color: '#a855f7', fontSize: 14, marginTop: 2 },
  wordEn: { color: '#94a3b8', fontSize: 13, marginTop: 2 },
  example: { color: '#64748b', fontSize: 12, marginTop: 6, fontStyle: 'italic' },
  hskBadge: { backgroundColor: '#9333ea33', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  hskText: { color: '#c4b5fd', fontSize: 11, fontWeight: '600' },
});
