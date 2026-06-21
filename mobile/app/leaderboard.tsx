import { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { fetchLeaderboard, LeaderboardEntry } from '../src/lib/leaderboard-service';
import { useAuth } from '../src/lib/auth-context';
import { AppHeader } from '../src/components/app-header';
import { LoginRequiredPrompt } from '../src/components/login-required-prompt';
import { useTheme } from '../src/theme/theme-context';
import { useLocale } from '../src/lib/locale-react-context';
import { spacing, radius, typography, fonts, makeShadow } from '../src/theme/theme';

type Tab = 'weekly' | 'alltime';

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

function Avatar({ url, name, size = 36 }: { url: string | null; name: string; size?: number }) {
  const { colors } = useTheme();
  const initials = name.slice(0, 2).toUpperCase();
  if (url) {
    return <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ fontFamily: fonts.label, fontSize: size * 0.35, color: colors.primary }}>{initials}</Text>
    </View>
  );
}

function EntryRow({ entry, tab, isSticky }: { entry: LeaderboardEntry; tab: Tab; isSticky?: boolean }) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const medal = MEDAL[entry.rank];
  const isTop3 = entry.rank <= 3;

  return (
    <View style={[
      styles.row,
      entry.isMe && { backgroundColor: colors.primarySoft },
      isSticky && styles.stickyRow,
      isSticky && { backgroundColor: colors.surface, borderTopColor: colors.outlineVariant },
    ]}>
      {/* Rank */}
      <View style={styles.rankCell}>
        {medal
          ? <Text style={{ fontSize: 20 }}>{medal}</Text>
          : <Text style={[styles.rankNum, { color: isTop3 ? colors.primary : colors.outline }]}>
              {entry.rank ?? '—'}
            </Text>
        }
      </View>

      <Avatar url={entry.avatarUrl} name={entry.displayName} size={34} />

      <View style={{ flex: 1 }}>
        <Text style={[typography.label, { color: entry.isMe ? colors.primary : colors.onSurface }]} numberOfLines={1}>
          {entry.isMe ? `${entry.displayName} (${t('leaderboard.youSuffix')})` : entry.displayName}
        </Text>
      </View>

      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.xp, { color: isTop3 ? colors.primary : colors.onSurface }]}>
          {entry.xp.toLocaleString()}
        </Text>
        <Text style={[typography.body, { fontSize: 10, color: colors.outline }]}>
          XP
        </Text>
      </View>
    </View>
  );
}

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { t } = useLocale();
  const [tab, setTab] = useState<Tab>('weekly');
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [myEntry, setMyEntry] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState<string | null>(null);

  const load = useCallback(async (t: Tab) => {
    setLoading(true);
    try {
      const data = await fetchLeaderboard(t);
      setBoard(data.board);
      setMyEntry(data.myEntry);
      setWeekStart(data.weekStart ?? null);
    } catch {
      setBoard([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(tab); }, [tab, load]));

  if (!user) {
    return <LoginRequiredPrompt message={t('leaderboard.loginPrompt')} />;
  }

  const weekLabel = weekStart
    ? t('leaderboard.weekOf', { date: new Date(weekStart).toLocaleDateString('en', { month: 'short', day: 'numeric' }) })
    : t('leaderboard.thisWeek');

  // Show my entry pinned at bottom only if I'm outside the visible board
  const myEntryOutside = myEntry && !board.some((e) => e.isMe);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title={t('leaderboard.title')} showBack />

      {/* Tab toggle */}
      <View style={[styles.tabs, { backgroundColor: colors.surface, borderBottomColor: colors.outlineVariant }]}>
        {(['weekly', 'alltime'] as Tab[]).map((tabId) => (
          <Pressable key={tabId} style={[styles.tab, tab === tabId && { borderBottomColor: colors.primary }]} onPress={() => setTab(tabId)}>
            <Text style={[typography.label, { fontSize: 13, color: tab === tabId ? colors.primary : colors.outline }]}>
              {tabId === 'weekly' ? t('leaderboard.weeklyXp') : t('leaderboard.alltime')}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === 'weekly' && (
        <Text style={[typography.body, { fontSize: 12, color: colors.outline, textAlign: 'center', paddingTop: spacing.sm }]}>
          {weekLabel} · {t('leaderboard.xpFormula')}
        </Text>
      )}

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[typography.body, { color: colors.outline }]}>{t('leaderboard.loadingRankings')}</Text>
        </View>
      ) : board.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl }}>
          <MaterialIcons name="leaderboard" size={48} color={colors.outline} />
          <Text style={[typography.heading, { color: colors.onSurface }]}>{t('leaderboard.noDataTitle')}</Text>
          <Text style={[typography.body, { color: colors.outline, textAlign: 'center' }]}>
            {t('leaderboard.noDataSub')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={board.slice(3)}
          keyExtractor={(e) => e.userId}
          contentContainerStyle={{ padding: spacing.containerMargin, paddingBottom: myEntryOutside ? 100 : 40 }}
          renderItem={({ item }) => <EntryRow entry={item} tab={tab} />}
          ListHeaderComponent={
            <View style={[styles.card, { backgroundColor: colors.surface, ...makeShadow(colors, 'card'), marginBottom: spacing.md }]}>
              {board.slice(0, 3).map((e, i) => (
                <View key={e.userId}>
                  {i > 0 && <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.outlineVariant }} />}
                  <EntryRow entry={e} tab={tab} />
                </View>
              ))}
            </View>
          }
        />
      )}

      {/* Sticky "my rank" footer when outside top 50 */}
      {myEntryOutside && (
        <View style={[styles.myFooter, { backgroundColor: colors.surface, borderTopColor: colors.outlineVariant, ...makeShadow(colors, 'card') }]}>
          <Text style={[typography.body, { fontSize: 11, color: colors.outline, marginBottom: 4 }]}>{t('leaderboard.yourRank')}</Text>
          <EntryRow entry={myEntry!} tab={tab} isSticky />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1, alignItems: 'center', paddingVertical: spacing.md,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  card: { borderRadius: radius.lg, overflow: 'hidden' },
  row: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.md, paddingVertical: 10, paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  stickyRow: { borderTopWidth: StyleSheet.hairlineWidth },
  rankCell: { width: 32, alignItems: 'center' },
  rankNum: { fontFamily: fonts.headlineSemi, fontSize: 15 },
  xp: { fontFamily: fonts.headlineSemi, fontSize: 16 },
  myFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: spacing.md, paddingBottom: spacing.xl, borderTopWidth: StyleSheet.hairlineWidth,
  },
});
