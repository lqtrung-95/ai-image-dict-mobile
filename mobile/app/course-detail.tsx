import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { speakChinese } from '../src/lib/tts-speech-service';
import {
  fetchCourseDetail, subscribeToCourse, unsubscribeFromCourse, rateCourse, CourseDetail,
} from '../src/lib/courses-service';
import { useTheme } from '../src/theme/theme-context';
import { spacing, radius, typography, fonts } from '../src/theme/theme';

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
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
    return <View style={[styles.centered, { backgroundColor: colors.background }]}><Text style={[typography.body, { color: colors.error }]}>{error}</Text></View>;
  }
  if (!detail) {
    return <View style={[styles.centered, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.primary} /></View>;
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
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.containerMargin, paddingBottom: 48 }}>
      <Stack.Screen options={{ title: course.name }} />

      <Text style={[typography.headline, { color: colors.onSurface }]}>{course.name}</Text>
      {course.description ? <Text style={[typography.body, { color: colors.onSurfaceVariant, marginTop: spacing.sm }]}>{course.description}</Text> : null}
      <Text style={[typography.label, { fontSize: 13, color: colors.outline, marginTop: spacing.sm }]}>
        HSK {course.difficultyLevel} · {course.wordCount} words · {course.subscriberCount} learners
        {course.ratingAvg != null ? ` · ★ ${course.ratingAvg.toFixed(1)}` : ''}
      </Text>

      <Pressable
        style={[styles.subscribeBtn, subscribed ? { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary } : { backgroundColor: colors.primaryContainer }]}
        onPress={toggleSubscribe}
        disabled={busy}
      >
        <Text style={[typography.label, { fontSize: 15, color: subscribed ? colors.primary : colors.onPrimaryContainer }]}>
          {busy ? '…' : subscribed ? '✓ Subscribed — tap to unsubscribe' : 'Subscribe to this course'}
        </Text>
      </Pressable>

      {subscribed && (
        <View style={styles.rateRow}>
          <Text style={[typography.body, { color: colors.onSurfaceVariant, marginRight: 4 }]}>Your rating:</Text>
          {[1, 2, 3, 4, 5].map((s) => (
            <Pressable key={s} onPress={() => handleRate(s)}>
              <Text style={{ color: '#d9a14a', fontSize: 26 }}>{s <= myRating ? '★' : '☆'}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <Text style={[typography.heading, { color: colors.onSurface, marginTop: spacing.lg, marginBottom: spacing.md }]}>Words ({words.length})</Text>
      {words.map((w) => (
        <Pressable key={w.id} style={[styles.wordCard, { backgroundColor: colors.surface }]} onPress={() => speakChinese(w.word_zh)}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.hanzi, fontSize: 22, color: colors.onSurface }}>{w.word_zh}</Text>
            <Text style={[typography.pinyin, { color: colors.primary, marginTop: 2 }]}>{w.word_pinyin}</Text>
            <Text style={[typography.body, { color: colors.onSurfaceVariant, marginTop: 2 }]}>{w.word_en}</Text>
            {w.example_sentence ? <Text style={[typography.pinyin, { color: colors.outline, marginTop: 6, fontStyle: 'italic' }]}>{w.example_sentence}</Text> : null}
          </View>
          {w.hsk_level != null && (
            <View style={{ backgroundColor: colors.primarySoft, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={[typography.label, { fontSize: 11, color: colors.primary }]}>HSK {w.hsk_level}</Text>
            </View>
          )}
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  subscribeBtn: { borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md, alignItems: 'center' },
  rateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.md },
  wordCard: { borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'flex-start' },
});
