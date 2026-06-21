import { useEffect, useRef } from 'react';
import { Text, Pressable, View, Image, StyleSheet, Animated, PanResponder, Platform, ScrollView } from 'react-native';
import { speakChinese } from '../lib/tts-speech-service';
import { tapLight, tapSelection } from '../lib/haptics-service';
import type { DueWord, SrsRating } from '../lib/practice-service';
import { useTheme } from '../theme/theme-context';
import { useLocale } from '../lib/locale-react-context';
import { spacing, radius, typography, fonts, makeShadow } from '../theme/theme';
import { Icon } from '../theme/ui-primitives';

const SWIPE_THRESHOLD = 80;
const MAX_ROTATION = 8;

interface Props {
  word: DueWord;
  flipped: boolean;
  onFlip: () => void;
  onRate: (rating: SrsRating) => void;
}

// Front: tap to reveal. Back: swipe right = Good, left = Again (mobile).
// Web: 2-button fallback shown after flip.
export function PracticeFlashcard({ word, flipped, onFlip, onRate }: Props) {
  const { colors } = useTheme();
  const { t } = useLocale();

  const pan = useRef(new Animated.ValueXY()).current;
  // Separate opacity so we can fade the card out independently of position
  const cardOpacity = useRef(new Animated.Value(1)).current;

  // Refs so PanResponder closure always reads current props (avoids stale captures)
  const flippedRef = useRef(flipped);
  const onRateRef = useRef(onRate);
  useEffect(() => { flippedRef.current = flipped; }, [flipped]);
  useEffect(() => { onRateRef.current = onRate; }, [onRate]);

  // New word arrives: reset position then fade in (opacity stays 0 until here so old card never flashes)
  useEffect(() => {
    pan.setValue({ x: 0, y: 0 });
    cardOpacity.setValue(0);
    Animated.timing(cardOpacity, { toValue: 1, duration: 180, useNativeDriver: false }).start();
  }, [word.id, pan, cardOpacity]);

  const rotate = pan.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD * 2, 0, SWIPE_THRESHOLD * 2],
    outputRange: [`-${MAX_ROTATION}deg`, '0deg', `${MAX_ROTATION}deg`],
    extrapolate: 'clamp',
  });

  // Card tint: red when dragging left (Again), green when dragging right (Good)
  const redTint = pan.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [0.18, 0],
    extrapolate: 'clamp',
  });

  const greenTint = pan.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 0.18],
    extrapolate: 'clamp',
  });

  const exitCard = (direction: 'left' | 'right', rating: SrsRating) => {
    const toX = direction === 'right' ? 450 : -450;
    // C: slide off + fade — consistent 300ms so the motion is readable, not jarring
    Animated.parallel([
      Animated.timing(pan, { toValue: { x: toX, y: 0 }, duration: 300, useNativeDriver: false }),
      Animated.timing(cardOpacity, { toValue: 0, duration: 220, useNativeDriver: false }),
    ]).start(() => {
      pan.setValue({ x: 0, y: 0 });
      // Keep opacity at 0 — useEffect on word.id will fade the new card in
      onRateRef.current(rating);
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) =>
        flippedRef.current && Math.abs(gs.dx) > 10 && Math.abs(gs.dx) > Math.abs(gs.dy),
      onPanResponderMove: (_, gs) => {
        pan.setValue({ x: gs.dx, y: 0 });
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dx > SWIPE_THRESHOLD || gs.vx > 0.6) {
          tapSelection(); // haptic fires immediately on release, not after animation
          exitCard('right', 3);
        } else if (gs.dx < -SWIPE_THRESHOLD || gs.vx < -0.6) {
          tapSelection();
          exitCard('left', 1);
        } else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false, bounciness: 8, speed: 14 }).start();
        }
      },
    })
  ).current;

  const isWeb = Platform.OS === 'web';

  // Front face of the card
  const frontFace = (
    <View style={styles.faceCenter}>
      <Text style={[styles.zh, { color: colors.onSurface }]}>{word.wordZh}</Text>
      <Pressable onPress={() => speakChinese(word.wordZh)} style={styles.speakerBtn}>
        <Icon name="volume-up" size={26} color={colors.primary} />
      </Pressable>
      <Text style={[typography.body, { color: colors.outline, marginTop: spacing.lg }]}>
        {t('flashcards.tapToReveal')}
      </Text>
    </View>
  );

  // Revealed back face
  const backFace = (
    <ScrollView
      contentContainerStyle={styles.backContent}
      showsVerticalScrollIndicator={false}
      scrollEnabled
    >
      <Text style={[styles.zh, { color: colors.onSurface }]}>{word.wordZh}</Text>
      <Pressable onPress={() => speakChinese(word.wordZh)} style={styles.speakerBtn}>
        <Icon name="volume-up" size={26} color={colors.primary} />
      </Pressable>
      {word.photoUrl ? (
        <Image source={{ uri: word.photoUrl }} style={styles.photo} resizeMode="cover" />
      ) : null}
      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 22, color: colors.primary, marginTop: spacing.sm }}>
        {word.wordPinyin}
      </Text>
      <Text style={[typography.heading, { color: colors.onSurface, marginTop: spacing.xs, textAlign: 'center' }]}>
        {word.wordEn}
      </Text>
      {word.exampleSentence ? (
        <View style={styles.exampleBlock}>
          <Text style={[typography.body, { color: colors.onSurfaceVariant, fontStyle: 'italic', textAlign: 'center' }]}>
            {word.exampleSentence}
          </Text>
          {word.exampleSentencePinyin ? (
            <Text style={[typography.pinyin, { color: colors.primary, marginTop: 4, textAlign: 'center' }]}>
              {word.exampleSentencePinyin}
            </Text>
          ) : null}
          {word.exampleSentenceEn ? (
            <Text style={[typography.pinyin, { color: colors.outline, marginTop: 2, textAlign: 'center' }]}>
              {word.exampleSentenceEn}
            </Text>
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );

  const cardStyle = [
    styles.card,
    { backgroundColor: colors.surface, borderColor: colors.outlineVariant, ...makeShadow(colors, 'card') },
  ];

  return (
    <View style={styles.container}>
      {isWeb ? (
        <Pressable style={cardStyle} onPress={() => { tapLight(); onFlip(); }}>
          {flipped ? backFace : frontFace}
        </Pressable>
      ) : (
        <Animated.View
          style={[cardStyle, { opacity: cardOpacity, transform: [{ translateX: pan.x }, { rotate }] }]}
          {...panResponder.panHandlers}
        >
          <Pressable onPress={() => { tapLight(); onFlip(); }}>
            {flipped ? backFace : frontFace}
          </Pressable>
          {/* Color wash over card — red = Again, green = Good */}
          <Animated.View style={[styles.tintLayer, { backgroundColor: '#ba181b', opacity: redTint }]} pointerEvents="none" />
          <Animated.View style={[styles.tintLayer, { backgroundColor: '#2d6a4f', opacity: greenTint }]} pointerEvents="none" />
        </Animated.View>
      )}

      {/* Mobile: static swipe hint below card, only shown after flip */}
      {flipped && !isWeb && (
        <View style={styles.mobileHint} pointerEvents="none">
          <Text style={[typography.label, { fontSize: 12, color: colors.outline, textAlign: 'center' }]}>
            ← {t('flashcards.swipeHintLeft')}{'   '}{t('flashcards.swipeHintRight')} →
          </Text>
        </View>
      )}

      {/* Web: 2-button fallback */}
      {flipped && isWeb && (
        <View style={styles.ratingRow}>
          <Pressable
            style={({ pressed }) => [styles.ratingBtn, { borderColor: '#ba181b', backgroundColor: colors.surface }, pressed && { transform: [{ scale: 0.96 }] }]}
            onPress={() => { tapSelection(); onRate(1); }}
          >
            <Text style={[typography.label, { fontSize: 14, color: '#ba181b' }]}>← {t('flashcards.ratingAgain')}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.ratingBtn, { borderColor: '#2d6a4f', backgroundColor: colors.surface }, pressed && { transform: [{ scale: 0.96 }] }]}
            onPress={() => { tapSelection(); onRate(3); }}
          >
            <Text style={[typography.label, { fontSize: 14, color: '#2d6a4f' }]}>{t('flashcards.ratingGood')} →</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  faceCenter: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  backContent: {
    padding: spacing.xl,
    alignItems: 'center',
    paddingBottom: spacing.xl,
  },
  zh: { fontFamily: fonts.hanzi, fontSize: 64, textAlign: 'center' },
  speakerBtn: { marginTop: spacing.sm, padding: spacing.sm },
  photo: { width: 160, height: 110, borderRadius: radius.md, marginTop: spacing.md },
  exampleBlock: { marginTop: spacing.md, alignItems: 'center' },
  ratingRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.lg },
  ratingBtn: { flex: 1, borderWidth: 1.5, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  // Absolute overlay that tints the card red or green during drag
  tintLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.xl,
  },
  mobileHint: { marginTop: spacing.md, alignItems: 'center' },
});
