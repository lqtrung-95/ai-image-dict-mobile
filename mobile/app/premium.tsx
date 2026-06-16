import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import type { PurchasesPackage } from 'react-native-purchases';
import { PACKAGE_TYPE } from 'react-native-purchases';
import { getOfferings, purchasePackage, restorePurchases, isPremium } from '../src/lib/purchases-service';
import { usePremium } from '../src/lib/premium-context';
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

function packageLabel(pkg: PurchasesPackage): { period: string; price: string; sub: string; savings?: string } {
  const price = pkg.product.priceString;
  switch (pkg.packageType) {
    case PACKAGE_TYPE.ANNUAL:
      return { period: 'Annual', price, sub: 'per year', savings: 'save 43%' };
    case PACKAGE_TYPE.MONTHLY:
      return { period: 'Monthly', price, sub: 'per month' };
    case PACKAGE_TYPE.WEEKLY:
      return { period: 'Weekly', price, sub: 'per week' };
    default:
      return { period: pkg.product.title, price, sub: '' };
  }
}

export default function PremiumScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { isPremiumUser, refresh } = usePremium();

  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selected, setSelected] = useState<PurchasesPackage | null>(null);
  const [loadingPkgs, setLoadingPkgs] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    getOfferings().then((pkgs) => {
      setPackages(pkgs);
      // Pre-select annual if available, otherwise first package
      const annual = pkgs.find((p) => p.packageType === PACKAGE_TYPE.ANNUAL);
      setSelected(annual ?? pkgs[0] ?? null);
      setLoadingPkgs(false);
    });
  }, []);

  const handlePurchase = async () => {
    if (!selected) return;
    setPurchasing(true);
    try {
      const info = await purchasePackage(selected);
      await refresh();
      if (isPremium(info)) {
        Alert.alert('Welcome to Premium! 🎉', 'All features are now unlocked.', [
          { text: 'Start learning', onPress: () => router.back() },
        ]);
      }
    } catch (err: any) {
      // userCancelled has code 1 — don't show an error for that
      if (err?.code !== '1' && err?.userCancelled !== true) {
        Alert.alert('Purchase failed', err?.message ?? 'Something went wrong. Please try again.');
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const info = await restorePurchases();
      await refresh();
      if (isPremium(info)) {
        Alert.alert('Premium restored!', 'Your subscription has been restored.', [
          { text: 'Continue', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('No active subscription', 'We could not find an active premium subscription for your account.');
      }
    } catch {
      Alert.alert('Restore failed', 'Please try again later.');
    } finally {
      setRestoring(false);
    }
  };

  if (isPremiumUser) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppHeader title="Premium" showBack />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl }}>
          <Text style={{ fontSize: 56 }}>👑</Text>
          <Text style={[styles.heroTitle, { color: colors.onSurface }]}>You're Premium!</Text>
          <Text style={[typography.body, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
            All features are unlocked. Thank you for supporting Snap Mandarin.
          </Text>
          <Pressable
            style={[styles.cta, { backgroundColor: colors.primary, marginTop: spacing.md }]}
            onPress={() => router.back()}
          >
            <Text style={[typography.label, { fontSize: 15, color: colors.onPrimary }]}>Back to app</Text>
          </Pressable>
        </View>
      </View>
    );
  }

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
        {loadingPkgs ? (
          <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[typography.body, { color: colors.outline, marginTop: spacing.sm }]}>Loading plans…</Text>
          </View>
        ) : packages.length === 0 ? (
          <View style={[styles.noPkgs, { backgroundColor: colors.surface }]}>
            <Text style={[typography.body, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
              Plans unavailable right now. Please try again later.
            </Text>
          </View>
        ) : (
          <View style={styles.plansRow}>
            {packages.map((pkg) => {
              const { period, price, sub, savings } = packageLabel(pkg);
              const isSelected = selected?.identifier === pkg.identifier;
              const isAnnual = pkg.packageType === PACKAGE_TYPE.ANNUAL;
              return (
                <Pressable
                  key={pkg.identifier}
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
                  onPress={() => setSelected(pkg)}
                >
                  {savings && (
                    <View style={[styles.bestBadge, { backgroundColor: isSelected ? colors.onPrimary : colors.primary }]}>
                      <Text style={[typography.label, { fontSize: 10, color: isSelected ? colors.primary : colors.onPrimary }]}>
                        {savings.toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <Text style={[typography.label, { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: isSelected ? colors.onPrimary : colors.outline, opacity: isSelected ? 0.85 : 1 }]}>
                    {period}
                  </Text>
                  <Text style={[styles.price, { color: isSelected ? colors.onPrimary : colors.onSurface }]}>{price}</Text>
                  <Text style={[typography.body, { fontSize: 12, color: isSelected ? colors.onPrimary : colors.outline, opacity: isSelected ? 0.8 : 1 }]}>{sub}</Text>
                  {isSelected && (
                    <View style={[styles.checkBadge, { backgroundColor: colors.onPrimary }]}>
                      <MaterialIcons name="check" size={14} color={colors.primary} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

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
          style={({ pressed }) => [
            styles.cta,
            { backgroundColor: !selected ? colors.surfaceContainer : colors.primary, opacity: pressed ? 0.88 : 1 },
          ]}
          onPress={handlePurchase}
          disabled={purchasing || !selected}
        >
          {purchasing ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={[typography.label, { fontSize: 16, color: colors.onPrimary }]}>
              {selected ? `Subscribe — ${packageLabel(selected).price}/${packageLabel(selected).sub.split(' ')[1] ?? 'mo'}` : 'Select a plan'}
            </Text>
          )}
        </Pressable>

        <Text style={[typography.body, { fontSize: 11, color: colors.outline, textAlign: 'center', paddingHorizontal: spacing.lg }]}>
          Payment will be charged to your App Store account. Subscription auto-renews unless cancelled at least 24 hours before the end of the current period.
        </Text>

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.xl }}>
          <Pressable onPress={handleRestore} disabled={restoring}>
            <Text style={[typography.label, { fontSize: 13, color: colors.primary }]}>
              {restoring ? 'Restoring…' : 'Restore purchases'}
            </Text>
          </Pressable>
          <Pressable onPress={() => router.back()}>
            <Text style={[typography.body, { fontSize: 13, color: colors.outline }]}>Maybe later</Text>
          </Pressable>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.containerMargin, gap: spacing.md, paddingBottom: 40 },
  hero: { borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center', gap: spacing.sm },
  heroTitle: { fontFamily: fonts.headlineSemi, fontSize: 24, textAlign: 'center' },
  plansRow: { flexDirection: 'row', gap: spacing.md },
  planCard: { flex: 1, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', gap: 2, position: 'relative' },
  planCardAnnual: { paddingTop: spacing.lg + 4 },
  bestBadge: { position: 'absolute', top: -10, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  checkBadge: { position: 'absolute', bottom: spacing.sm, right: spacing.sm, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  price: { fontFamily: fonts.headlineSemi, fontSize: 28 },
  noPkgs: { borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center' },
  featureCard: { borderRadius: radius.lg, overflow: 'hidden' },
  featureRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  featureIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 40 + spacing.md * 2 },
  cta: { borderRadius: radius.pill, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', marginTop: spacing.xs },
});
