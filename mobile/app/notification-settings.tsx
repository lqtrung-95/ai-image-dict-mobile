import { useEffect, useState } from 'react';
import { View, Text, Switch, Pressable, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppHeader } from '../src/components/app-header';
import { showInfo } from '../src/lib/toast';
import {
  getReminderPrefs, enableReminder, disableReminder, ReminderPrefs,
} from '../src/lib/notifications-service';
import { useTheme } from '../src/theme/theme-context';
import { spacing, radius, typography } from '../src/theme/theme';
import { Icon } from '../src/theme/ui-primitives';

// Formats 24h hour/minute into a friendly 12h label (e.g. 7:00 PM).
function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${String(minute).padStart(2, '0')} ${period}`;
}

export default function NotificationSettingsScreen() {
  const { colors } = useTheme();
  const [prefs, setPrefs] = useState<ReminderPrefs | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => { getReminderPrefs().then(setPrefs); }, []);

  if (!prefs) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppHeader title="Reminders" showBack />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  const toggle = async (value: boolean) => {
    setBusy(true);
    try {
      if (value) {
        const next = await enableReminder(prefs.hour, prefs.minute);
        setPrefs(next);
        if (!next.enabled) {
          // Permission denied — point the user to OS settings.
          showInfo('Permission needed', 'Enable notifications for this app in your device settings.');
        }
      } else {
        await disableReminder();
        setPrefs({ ...prefs, enabled: false });
      }
    } finally {
      setBusy(false);
    }
  };

  const onTimeChange = async (_event: unknown, date?: Date) => {
    // Android dismisses the picker on selection; iOS keeps it inline.
    if (Platform.OS !== 'ios') setShowPicker(false);
    if (!date) return;
    const hour = date.getHours();
    const minute = date.getMinutes();
    setPrefs({ ...prefs, hour, minute });
    if (prefs.enabled) {
      // Reschedule immediately to the new time.
      const next = await enableReminder(hour, minute);
      setPrefs(next);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title="Reminders" showBack />
      <View style={{ padding: spacing.containerMargin }}>
        <Text style={[typography.body, { color: colors.onSurfaceVariant, marginBottom: spacing.lg }]}>
          Get a daily nudge to practice and keep your streak alive.
        </Text>

        <View style={[styles.row, { backgroundColor: colors.surface }]}>
          <Icon name="notifications-active" size={20} color={colors.primary} />
          <Text style={[typography.body, { flex: 1, color: colors.onSurface }]}>Daily study reminder</Text>
          {busy ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Switch
              value={prefs.enabled}
              onValueChange={toggle}
              trackColor={{ true: colors.primary }}
            />
          )}
        </View>

        {prefs.enabled && (
          <Pressable
            style={[styles.row, { backgroundColor: colors.surface, marginTop: spacing.sm }]}
            onPress={() => setShowPicker((s) => !s)}
          >
            <Icon name="schedule" size={20} color={colors.onSurfaceVariant} />
            <Text style={[typography.body, { flex: 1, color: colors.onSurface }]}>Reminder time</Text>
            <Text style={[typography.label, { fontSize: 14, color: colors.primary }]}>
              {formatTime(prefs.hour, prefs.minute)}
            </Text>
          </Pressable>
        )}

        {showPicker && prefs.enabled && (
          <View style={{ alignItems: 'center', marginTop: spacing.sm }}>
            <DateTimePicker
              mode="time"
              value={(() => { const d = new Date(); d.setHours(prefs.hour, prefs.minute, 0, 0); return d; })()}
              onChange={onTimeChange}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.md, borderRadius: radius.lg,
  },
});
