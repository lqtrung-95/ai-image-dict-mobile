import { View, Text, StyleSheet } from 'react-native';

interface Props {
  data: { date: string; count: number }[];
  highlightToday?: boolean;
  accentColor?: string;
}

// Simple 7-bar chart used for "words added" and "review forecast".
// Pure views — no chart library needed for this scale.
export function StatsBarChart({ data, highlightToday = true, accentColor = '#a855f7' }: Props) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <View style={styles.row}>
      {data.map((day, i) => {
        const heightPct = Math.max((day.count / max) * 100, 4);
        const isToday = highlightToday && day.date === todayStr;
        const label = isToday
          ? 'Today'
          : new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
        return (
          <View key={`${day.date}-${i}`} style={styles.col}>
            <Text style={styles.count}>{day.count}</Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.bar,
                  { height: `${heightPct}%`, backgroundColor: isToday ? accentColor : `${accentColor}66` },
                ]}
              />
            </View>
            <Text style={[styles.day, isToday && { color: accentColor, fontWeight: '600' }]}>
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  col: { flex: 1, alignItems: 'center', gap: 4 },
  count: { color: '#fff', fontSize: 12, fontWeight: '600' },
  barTrack: { height: 80, width: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  day: { color: '#64748b', fontSize: 11 },
});
