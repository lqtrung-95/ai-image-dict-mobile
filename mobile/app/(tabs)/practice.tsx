import { useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/lib/auth-context';
import { LoginRequiredPrompt } from '../../src/components/login-required-prompt';
import { Icon } from '../../src/theme/ui-primitives';
import { useTheme } from '../../src/theme/theme-context';
import { spacing, radius, typography, fonts, makeShadow } from '../../src/theme/theme';
import { AppHeader } from '../../src/components/app-header';
import { fetchStats } from '../../src/lib/stats-service';
import { useLocale } from '../../src/lib/locale-react-context';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];
type Href = Parameters<ReturnType<typeof useRouter>['push']>[0];

interface Quiz {
  href: Href;
  icon: IconName;
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  score?: string;
  premium?: boolean;
}

interface MiniGame {
  href: Href;
  icon: IconName;
  title: string;
  subtitle: string;
  stat: string;
  premium?: boolean;
}

export default function PracticeMenuScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { t } = useLocale();
  const router = useRouter();

  const QUIZZES: Quiz[] = [
    { href: '/practice-flashcards', icon: 'style', title: t('practiceMenu.flashcardsTitle'), subtitle: t('practiceMenu.flashcardsSub'), badge: 'SRS', badgeColor: '#2d6a4f' },
    { href: { pathname: '/practice-quiz', params: { mode: 'multiple-choice' } }, icon: 'quiz', title: t('practiceMenu.multipleChoiceTitle'), subtitle: t('practiceMenu.multipleChoiceSub'), badge: 'Lv 2', badgeColor: '#4caf50', premium: true },
    { href: { pathname: '/practice-quiz', params: { mode: 'listening' } }, icon: 'hearing', title: t('practiceMenu.listeningTitle'), subtitle: t('practiceMenu.listeningSub'), score: 'Score 850', premium: true },
    { href: { pathname: '/practice-quiz', params: { mode: 'pinyin' } }, icon: 'translate', title: t('practiceMenu.pinyinTitle'), subtitle: t('practiceMenu.pinyinSub'), badge: 'Lv 4', badgeColor: '#e53935', premium: true },
    { href: '/practice-handwriting', icon: 'draw', title: t('practiceMenu.handwritingTitle'), subtitle: t('practiceMenu.handwritingSub'), badge: 'New', badgeColor: '#0f5238', premium: true },
  ];

  const MINI_GAMES: MiniGame[] = [
    { href: { pathname: '/practice-games', params: { game: 'matching' } }, icon: 'extension', title: t('practiceMenu.characterMatchTitle'), subtitle: t('practiceMenu.characterMatchSub'), stat: 'Top: 1240', premium: true },
    { href: { pathname: '/practice-games', params: { game: 'rapid' } }, icon: 'speed', title: t('practiceMenu.speedQuizTitle'), subtitle: t('practiceMenu.speedQuizSub'), stat: 'Streak: 12', premium: true },
  ];
  const [streak, setStreak] = useState(0);
  const [quizGoalDone, setQuizGoalDone] = useState(12);
  const quizGoalTotal = 20;
  const goalPct = Math.min(quizGoalDone / quizGoalTotal, 1);

  useFocusEffect(useCallback(() => {
    if (!user) return;
    fetchStats().then((s) => {
      setStreak(s.currentStreak ?? 0);
      setQuizGoalDone(Math.min(s.totalWords ?? 0, quizGoalTotal));
    }).catch(() => {});
  }, [user]));

  if (!user) {
    return <LoginRequiredPrompt message="Log in to practice with flashcards, quizzes, and games." />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* Weekly Quiz Goal banner */}
        <View style={[styles.goalCard, { backgroundColor: colors.surface, ...makeShadow(colors, 'card') }]}>
          <View style={{ flex: 1 }}>
            <Text style={[typography.label, { fontSize: 11, color: colors.outline, textTransform: 'uppercase', letterSpacing: 0.5 }]}>
              {t('practiceMenu.weeklyGoalLabel')}
            </Text>
            <Text style={[styles.goalStat, { color: colors.onSurface }]}>
              {t('practiceMenu.challengesStat', { done: quizGoalDone, total: quizGoalTotal })}
            </Text>
            <Text style={[typography.body, { fontSize: 13, color: colors.outline }]}>{t('practiceMenu.weeklyGoalCompleted')}</Text>

            {/* Progress bar */}
            <View style={[styles.goalTrack, { backgroundColor: colors.surfaceContainer }]}>
              <View style={[styles.goalFill, { width: `${Math.round(goalPct * 100)}%`, backgroundColor: colors.primary }]} />
            </View>
          </View>

          {/* Circular progress ring */}
          <View style={[styles.ringContainer, { borderColor: colors.surfaceContainer }]}>
            <View style={[styles.ringFill, { borderColor: colors.primary, opacity: goalPct }]} />
            <Text style={[styles.ringPct, { color: colors.onSurface }]}>{Math.round(goalPct * 100)}%</Text>
          </View>
        </View>

        {/* Knowledge Quizzes section */}
        <View style={styles.sectionHeader}>
          <Text style={[typography.heading, { color: colors.onSurface }]}>{t('practiceMenu.knowledgeQuizzes')}</Text>
          <Pressable onPress={() => router.push('/practice-quiz' as never)}>
            <Text style={[typography.label, { fontSize: 13, color: colors.primary }]}>{t('practiceMenu.viewAll')}</Text>
          </Pressable>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, ...makeShadow(colors, 'card') }]}>
          {QUIZZES.map((q, i) => (
            <View key={q.title}>
              {i > 0 && <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />}
              <Pressable
                style={styles.quizRow}
                onPress={() => q.premium ? router.push('/premium' as never) : router.push(q.href)}
              >
                <View style={[styles.quizIcon, { backgroundColor: q.premium ? colors.surfaceContainer : colors.primarySoft }]}>
                  <Icon name={q.icon} size={22} color={q.premium ? colors.outline : colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.heading, { color: q.premium ? colors.outline : colors.onSurface }]}>{q.title}</Text>
                  <Text style={[typography.body, { fontSize: 13, color: colors.outline }]}>{q.subtitle}</Text>
                </View>
                {q.premium ? (
                  <View style={[styles.pill, { backgroundColor: '#b8860b22' }]}>
                    <Text style={{ fontSize: 12 }}>👑</Text>
                  </View>
                ) : (
                  <>
                    {q.badge && (
                      <View style={[styles.pill, { backgroundColor: q.badgeColor ?? colors.primary }]}>
                        <Text style={[typography.label, { fontSize: 11, color: '#fff' }]}>{q.badge}</Text>
                      </View>
                    )}
                    {q.score && (
                      <Text style={[typography.label, { fontSize: 12, color: colors.primary }]}>{q.score}</Text>
                    )}
                  </>
                )}
                <MaterialIcons name="chevron-right" size={18} color={colors.outline} />
              </Pressable>
            </View>
          ))}
        </View>

        {/* Mini Games section */}
        <View style={styles.sectionHeader}>
          <Text style={[typography.heading, { color: colors.onSurface }]}>{t('practiceMenu.miniGames')}</Text>
          <Pressable onPress={() => router.push('/practice-games' as never)}>
            <Text style={[typography.label, { fontSize: 13, color: colors.primary }]}>{t('practiceMenu.explore')}</Text>
          </Pressable>
        </View>

        <View style={styles.miniGamesRow}>
          {MINI_GAMES.map((g) => (
            <Pressable
              key={g.title}
              style={[styles.miniCard, { backgroundColor: colors.surface, ...makeShadow(colors, 'card') }]}
              onPress={() => g.premium ? router.push('/premium' as never) : router.push(g.href)}
            >
              {g.premium && (
                <View style={[styles.crownBadge, { backgroundColor: '#b8860b22' }]}>
                  <Text style={{ fontSize: 11 }}>👑</Text>
                </View>
              )}
              <View style={[styles.miniIcon, { backgroundColor: g.premium ? colors.surfaceContainer : colors.primarySoft }]}>
                <Icon name={g.icon} size={26} color={g.premium ? colors.outline : colors.primary} />
              </View>
              <View style={{ marginTop: spacing.sm }}>
                <Text style={[typography.heading, { color: g.premium ? colors.outline : colors.onSurface }]}>{g.title}</Text>
              </View>
              <Text style={[typography.body, { fontSize: 12, color: colors.outline }]}>{g.subtitle}</Text>
              <View style={[styles.miniStatRow, { borderTopColor: colors.outlineVariant }]}>
                <Text style={[typography.label, { fontSize: 11, color: colors.outline }]}>{g.premium ? 'Premium' : g.stat}</Text>
                <MaterialIcons name="arrow-forward" size={14} color={g.premium ? colors.outline : colors.primary} />
              </View>
            </Pressable>
          ))}
        </View>

        {/* Daily Special banner — the handwriting tracing game */}
        <Pressable
          style={[styles.dailySpecial, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/practice-handwriting')}
        >
          <View style={{ flex: 1 }}>
            <Text style={[typography.label, { fontSize: 11, color: colors.onPrimary, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }]}>
              {t('practiceMenu.dailySpecial')}
            </Text>
            <Text style={[styles.dailyTitle, { color: colors.onPrimary }]}>{t('practiceMenu.inkStrokeRush')}</Text>
            <Text style={[typography.body, { fontSize: 13, color: colors.onPrimary, opacity: 0.85, marginTop: 2, marginBottom: spacing.md }]}>
              {t('practiceMenu.inkStrokeRushSub')}
            </Text>
            <View style={[styles.startBtn, { backgroundColor: colors.onPrimary }]}>
              <Text style={[typography.label, { fontSize: 13, color: colors.primary }]}>{t('practiceMenu.startChallenge')}</Text>
            </View>
          </View>
          <View style={styles.dailyDecor}>
            <Text style={{ fontSize: 56 }}>筆</Text>
          </View>
        </Pressable>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.containerMargin, gap: spacing.md },
  // Goal card
  goalCard: {
    borderRadius: radius.lg, padding: spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
  },
  goalStat: { fontFamily: fonts.headlineSemi, fontSize: 20, marginTop: 2 },
  goalTrack: { height: 6, borderRadius: 3, marginTop: spacing.sm, overflow: 'hidden' },
  goalFill: { height: '100%', borderRadius: 3 },
  ringContainer: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 6, alignItems: 'center', justifyContent: 'center',
  },
  ringFill: {
    position: 'absolute', width: 72, height: 72, borderRadius: 36,
    borderWidth: 6,
  },
  ringPct: { fontFamily: fonts.headlineSemi, fontSize: 18 },
  // Section header
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: spacing.xs,
  },
  // Quiz list card
  card: { borderRadius: radius.lg, overflow: 'hidden' },
  quizRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  quizIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  pill: { borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 44 + spacing.md * 2 },
  // Mini games
  miniGamesRow: { flexDirection: 'row', gap: spacing.md },
  miniCard: { flex: 1, borderRadius: radius.lg, padding: spacing.md, position: 'relative' },
  crownBadge: {
    position: 'absolute', top: spacing.sm, right: spacing.sm,
    borderRadius: radius.pill, paddingHorizontal: 6, paddingVertical: 2, zIndex: 1,
  },
  miniIcon: { width: 52, height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  miniStatRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing.sm, marginTop: spacing.sm,
  },
  // Daily Special
  dailySpecial: {
    borderRadius: radius.xl, padding: spacing.lg,
    flexDirection: 'row', alignItems: 'flex-start', overflow: 'hidden',
  },
  dailyTitle: { fontFamily: fonts.headlineSemi, fontSize: 22 },
  startBtn: {
    alignSelf: 'flex-start', borderRadius: radius.pill,
    paddingHorizontal: spacing.md, paddingVertical: 8,
  },
  dailyDecor: { opacity: 0.25, position: 'absolute', right: spacing.md, top: spacing.md },
});
