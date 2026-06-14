import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/theme-context';
import { spacing, typography } from '../theme/theme';

interface Props {
  data: { date: string; count: number }[];
  highlightToday?: boolean;
}

// Simple 7-bar chart for "words added" and "review forecast". Jade bars.
export function StatsBarChart({ data, highlightToday = true }: Props) {
  const { colors } = useTheme();
  const max = Math.max(...data.map((d) => d.count), 1);
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <View style={styles.row}>
      {data.map((day, i) => {
        const heightPct = Math.max((day.count / max) * 100, 4);
        const isToday = highlightToday && day.date === todayStr;
        const label = isToday ? 'Today' : new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
        return (
          <View key={`${day.date}-${i}`} style={styles.col}>
            <Text style={[typography.label, { fontSize: 11, color: colors.onSurface }]}>{day.count}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.bar, { height: `${heightPct}%`, backgroundColor: isToday ? colors.primary : colors.primarySoft }]} />
            </View>
            <Text style={[typography.label, { fontSize: 10, color: isToday ? colors.primary : colors.outline }]}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs },
  col: { flex: 1, alignItems: 'center', gap: 4 },
  barTrack: { height: 80, width: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderTopLeftRadius: 6, borderTopRightRadius: 6 },
});
