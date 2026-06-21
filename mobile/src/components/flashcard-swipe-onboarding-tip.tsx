import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/theme-context';
import { useLocale } from '../lib/locale-react-context';
import { spacing, radius, typography, fonts } from '../theme/theme';

const STORAGE_KEY = 'flashcard_swipe_tip_seen';

interface Props {
  onDismiss: () => void;
}

// One-time modal tip explaining swipe-to-rate gesture. Shown before first flashcard session.
// Stores seen state in AsyncStorage so it never appears twice.
export function FlashcardSwipeOnboardingTip({ onDismiss }: Props) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const dismiss = async () => {
    await AsyncStorage.setItem(STORAGE_KEY, 'true').catch(() => {});
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(onDismiss);
  };

  return (
    <Modal transparent animationType="none" onRequestClose={dismiss}>
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[typography.heading, { color: colors.onSurface, textAlign: 'center', marginBottom: spacing.sm }]}>
            {t('flashcards.swipeTipTitle')}
          </Text>
          <Text style={[typography.body, { color: colors.onSurfaceVariant, textAlign: 'center', marginBottom: spacing.xl }]}>
            {t('flashcards.swipeTipBody')}
          </Text>

          {/* Visual demo arrows */}
          <View style={styles.arrowRow}>
            <View style={[styles.arrowBox, { borderColor: '#ba181b', backgroundColor: 'rgba(186,24,27,0.08)' }]}>
              <Text style={styles.arrowEmoji}>←</Text>
              <Text style={[typography.label, { color: '#ba181b', fontSize: 13 }]}>{t('flashcards.swipeHintLeft')}</Text>
            </View>
            <View style={[styles.arrowBox, { borderColor: '#2d6a4f', backgroundColor: 'rgba(45,106,79,0.08)' }]}>
              <Text style={styles.arrowEmoji}>→</Text>
              <Text style={[typography.label, { color: '#2d6a4f', fontSize: 13 }]}>{t('flashcards.swipeHintRight')}</Text>
            </View>
          </View>

          <Pressable
            style={[styles.btn, { backgroundColor: colors.primary }]}
            onPress={dismiss}
          >
            <Text style={[typography.label, { color: colors.onPrimary, fontSize: 15 }]}>
              {t('flashcards.swipeTipGot')}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

// Returns true if the tip has already been seen (call before rendering the session).
export async function hasSeenSwipeTip(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(STORAGE_KEY)) === 'true';
  } catch {
    return false;
  }
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
  },
  arrowRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  arrowBox: {
    flex: 1,
    borderWidth: 2,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  arrowEmoji: {
    fontSize: 28,
    fontFamily: fonts.headlineSemi,
  },
  btn: {
    borderRadius: radius.pill,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl * 2,
    alignItems: 'center',
  },
});
