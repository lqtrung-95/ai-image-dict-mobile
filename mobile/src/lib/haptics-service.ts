import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// Thin wrapper around expo-haptics. All calls are fire-and-forget and no-op on
// web (haptics are native-only). Used to give tactile feedback during practice:
// a light tap on flashcard flips, success on correct answers, error on wrong.

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

// Light tap — for non-committal interactions like flipping a flashcard.
export function tapLight(): void {
  if (!isNative) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

// Selection change — for picking an option / committing a choice.
export function tapSelection(): void {
  if (!isNative) return;
  Haptics.selectionAsync().catch(() => {});
}

// Success buzz — correct answer, completed round, matched pair.
export function notifySuccess(): void {
  if (!isNative) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

// Error buzz — wrong answer, failed match.
export function notifyError(): void {
  if (!isNative) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
}
