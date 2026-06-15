import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Local daily study-reminder scheduling. No backend required: we schedule a
// repeating calendar notification on-device. The user's preference (enabled +
// time of day) is persisted so we can re-render the settings UI and reschedule.

const ENABLED_KEY = 'reminderEnabled';
const HOUR_KEY = 'reminderHour';
const MINUTE_KEY = 'reminderMinute';
const DEFAULT_HOUR = 19; // 7pm — a sensible after-work/study default
const DEFAULT_MINUTE = 0;

export interface ReminderPrefs {
  enabled: boolean;
  hour: number;
  minute: number;
}

// Foreground display behaviour. Keeps reminders visible even if the app is open.
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function getReminderPrefs(): Promise<ReminderPrefs> {
  const [enabled, hour, minute] = await Promise.all([
    AsyncStorage.getItem(ENABLED_KEY),
    AsyncStorage.getItem(HOUR_KEY),
    AsyncStorage.getItem(MINUTE_KEY),
  ]);
  return {
    enabled: enabled === 'true',
    hour: hour != null ? parseInt(hour, 10) : DEFAULT_HOUR,
    minute: minute != null ? parseInt(minute, 10) : DEFAULT_MINUTE,
  };
}

async function savePrefs(prefs: ReminderPrefs): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(ENABLED_KEY, String(prefs.enabled)),
    AsyncStorage.setItem(HOUR_KEY, String(prefs.hour)),
    AsyncStorage.setItem(MINUTE_KEY, String(prefs.minute)),
  ]);
}

// Asks the OS for notification permission. Returns true if granted.
export async function requestPermission(): Promise<boolean> {
  if (!Device.isDevice) return false; // notifications don't fire on simulators
  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status === 'granted' && Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('study-reminders', {
      name: 'Study reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  return status === 'granted';
}

// Cancels any existing reminder, then (if enabled) schedules a new daily one.
async function reschedule(prefs: ReminderPrefs): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!prefs.enabled) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '时间到了 — Time to study! 📚',
      body: "Keep your streak alive. A few minutes of practice goes a long way.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: prefs.hour,
      minute: prefs.minute,
      ...(Platform.OS === 'android' ? { channelId: 'study-reminders' } : {}),
    },
  });
}

// Enable reminders: requests permission, persists prefs, schedules. Returns the
// effective prefs (enabled stays false if permission was denied).
export async function enableReminder(hour: number, minute: number): Promise<ReminderPrefs> {
  const granted = await requestPermission();
  const prefs: ReminderPrefs = { enabled: granted, hour, minute };
  await savePrefs(prefs);
  await reschedule(prefs);
  return prefs;
}

export async function disableReminder(): Promise<void> {
  const prefs = await getReminderPrefs();
  const next = { ...prefs, enabled: false };
  await savePrefs(next);
  await reschedule(next);
}

// Re-applies the saved schedule on app launch so reminders survive reinstalls /
// OS reboots that clear the scheduled-notification queue.
export async function syncReminderOnLaunch(): Promise<void> {
  const prefs = await getReminderPrefs();
  if (prefs.enabled) await reschedule(prefs);
}
