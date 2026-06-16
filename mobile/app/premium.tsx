import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../src/theme/theme-context';
import { spacing, radius, typography, fonts, makeShadow } from '../src/theme/theme';
import { AppHeader } from '../src/components/app-header';

const FEATURES = [
  { icon: 'all-inclusive' as const, title: 'Unlimited Photo Analyses', desc: 'Analyze as many photos as you want, every day.' },
  { icon: 'quiz' as const, title: 'All Quiz Modes', desc: 'Multiple choice, listening, pinyin master & more.' },
  { icon: 'draw' as const, title: 'Handwriting Practice', desc: 'Trace characters stroke by stroke with AI feedback.' },
  { icon: 'extension' as const, title: 'Mini Games', desc: 'Character Match, Speed Quiz, and future games.' },
  { icon: 'auto-stories' as const, title: 'Story Generation', desc: 'Unlimited AI stories from your photo vocabulary.' },
  { icon: 'bolt' as const, title: 'Priority AI Speed', desc: 'Faster analysis and story generation.' },
];

const PLANS = {
  monthly: { label: 'Monthly', price: '$3.50', sub: 'per month', cta: 'Start Premium — $3.50/mo' },
  annual:  { label: 'Annual',  price: '$24',   sub: 'per year · save 43%', cta: 'Start Premium — $24/yr' },
};

export default function PremiumScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [plan, setPlan] = useState<'monthly' | 'annual'>('annual');

  const selected = PLANS[plan];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title="Premium" showBack />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: colors.primary }]}>
          <Text style={{ fontSize: 44 }}>👑</Text>
          <Text style={[styles.heroTitle, { color: colors.onPrimary }]}>Snap Mandarin Premium</Text>
          <Text style={[typography.body, { color: colors.onPrimary, opacity: 0.85, textAlign: 'center' }]}>
            Everything you need to master Chinese — unlimited and ad-free.
          </Text>
        </View>

        {/* Plan selector */}
        <View style={styles.plansRow}>
          {(['monthly', 'annual'] as const).map((p) => {
            const isSelected = plan === p;
            const isAnnual = p === 'annual';
            return (
              <Pressable
                key={p}
                style={[
                  styles.planCard,
                  isAnnual && styles.planCardAnnual,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.outlineVariant,
                    borderWidth: 2,
                    ...makeShadow(colors, isSelected ? 'jade' : 'card'),
                  },
                ]}
                onPress={() => setPlan(p)}
              >
                {isAnnual && (
                  <View style={[styles.bestBadge, { backgroundColor: isSelected ? colors.onPrimary : colors.primary }]}>
                    <Text style={[typography.label, { fontSize: 10, color: isSelected ? colors.primary : colors.onPrimary }]}>
                      BEST VALUE
                    </Text>
                  </View>
                )}
                <Text style={[typography.label, { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: isSelected ? colors.onPrimary : colors.outline, opacity: isSelected ? 0.85 : 1 }]}>
                  {PLANS[p].label}
                </Text>
                <Text style={[styles.price, { color: isSelected ? colors.onPrimary : colors.onSurface }]}>
                  {PLANS[p].price}
                </Text>
                <Text style={[typography.body, { fontSize: 12, color: isSelected ? colors.onPrimary : colors.outline, opacity: isSelected ? 0.8 : 1 }]}>
                  {PLANS[p].sub}
                </Text>
                {isSelected && (
                  <View style={[styles.checkBadge, { backgroundColor: colors.onPrimary }]}>
                    <MaterialIcons name="check" size={14} color={colors.primary} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Feature list */}
        <Text style={[typography.heading, { color: colors.onSurface, marginBottom: spacing.sm }]}>What's included</Text>
        <View style={[styles.featureCard, { backgroundColor: colors.surface, ...makeShadow(colors, 'card') }]}>
          {FEATURES.map((f, i) => (
            <View key={f.title}>
              {i > 0 && <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />}
              <View style={styles.featureRow}>
                <View style={[styles.featureIcon, { backgroundColor: colors.primarySoft }]}>
                  <MaterialIcons name={f.icon} size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.heading, { fontSize: 14, color: colors.onSurface }]}>{f.title}</Text>
                  <Text style={[typography.body, { fontSize: 12, color: colors.outline }]}>{f.desc}</Text>
                </View>
                <MaterialIcons name="check-circle" size={18} color={colors.primary} />
              </View>
            </View>
          ))}
        </View>

        {/* CTA */}
        <Pressable
          style={({ pressed }) => [styles.cta, { backgroundColor: colors.primary, opacity: pressed ? 0.88 : 1 }]}
          onPress={() => {
            // TODO: wire up in-app purchase / Stripe checkout
          }}
        >
          <Text style={[typography.label, { fontSize: 16, color: colors.onPrimary }]}>{selected.cta}</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} style={{ alignSelf: 'center', marginBottom: spacing.xl }}>
          <Text style={[typography.body, { fontSize: 13, color: colors.outline }]}>Maybe later</Text>
        </Pressable>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.containerMargin, gap: spacing.md, paddingBottom: 40 },
  hero: {
    borderRadius: radius.xl, padding: spacing.xl,
    alignItems: 'center', gap: spacing.sm,
  },
  heroTitle: { fontFamily: fonts.headlineSemi, fontSize: 24, textAlign: 'center' },
  plansRow: { flexDirection: 'row', gap: spacing.md },
  planCard: {
    flex: 1, borderRadius: radius.lg, padding: spacing.md,
    alignItems: 'center', gap: 2, position: 'relative',
  },
  planCardAnnual: { paddingTop: spacing.lg + 4 },
  bestBadge: {
    position: 'absolute', top: -10, borderRadius: radius.pill,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  checkBadge: {
    position: 'absolute', bottom: spacing.sm, right: spacing.sm,
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  price: { fontFamily: fonts.headlineSemi, fontSize: 28 },
  featureCard: { borderRadius: radius.lg, overflow: 'hidden' },
  featureRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  featureIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 40 + spacing.md * 2 },
  cta: {
    borderRadius: radius.pill, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
    marginTop: spacing.xs,
  },
});
