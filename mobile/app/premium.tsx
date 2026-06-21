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
import { useLocale } from '../src/lib/locale-react-context';

export default function PremiumScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { isPremiumUser, refresh } = usePremium();
  const { t } = useLocale();

  const FEATURES = [
    { icon: 'all-inclusive' as const, title: t('premium.featurePhotosTitle'), desc: t('premium.featurePhotosDesc') },
    { icon: 'quiz' as const, title: t('premium.featureQuizTitle'), desc: t('premium.featureQuizDesc') },
    { icon: 'draw' as const, title: t('premium.featureHandwritingTitle'), desc: t('premium.featureHandwritingDesc') },
    { icon: 'extension' as const, title: t('premium.featureGamesTitle'), desc: t('premium.featureGamesDesc') },
    { icon: 'auto-stories' as const, title: t('premium.featureStoryTitle'), desc: t('premium.featureStoryDesc') },
    { icon: 'bolt' as const, title: t('premium.featureSpeedTitle'), desc: t('premium.featureSpeedDesc') },
  ];

  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selected, setSelected] = useState<PurchasesPackage | null>(null);
  const [loadingPkgs, setLoadingPkgs] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    getOfferings().then((pkgs) => {
      setPackages(pkgs);
      const annual = pkgs.find((p) => p.packageType === PACKAGE_TYPE.ANNUAL);
      setSelected(annual ?? pkgs[0] ?? null);
      setLoadingPkgs(false);
    });
  }, []);

  function packageLabel(pkg: PurchasesPackage): { period: string; price: string; sub: string; savings?: string } {
    const price = pkg.product.priceString;
    switch (pkg.packageType) {
      case PACKAGE_TYPE.ANNUAL:
        return { period: t('premium.periodAnnual'), price, sub: t('premium.subPerYear'), savings: t('premium.savingsBadge') };
      case PACKAGE_TYPE.MONTHLY:
        return { period: t('premium.periodMonthly'), price, sub: t('premium.subPerMonth') };
      case PACKAGE_TYPE.WEEKLY:
        return { period: t('premium.periodWeekly'), price, sub: t('premium.subPerWeek') };
      case PACKAGE_TYPE.LIFETIME:
        return { period: t('premium.periodLifetime'), price, sub: t('premium.subOneTime') };
      default:
        return { period: pkg.product.title, price, sub: '' };
    }
  }

  const handlePurchase = async () => {
    if (!selected) return;
    setPurchasing(true);
    try {
      const info = await purchasePackage(selected);
      await refresh();
      if (isPremium(info)) {
        Alert.alert(t('premium.welcomeTitle'), t('premium.welcomeBody'), [
          { text: t('premium.startLearning'), onPress: () => router.back() },
        ]);
      }
    } catch (err: any) {
      if (err?.code !== '1' && err?.userCancelled !== true) {
        Alert.alert(t('premium.purchaseFailed'), err?.message ?? t('premium.purchaseError'));
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
        Alert.alert(t('premium.premiumRestored'), t('premium.restoreSuccess'), [
          { text: t('premium.continueBtn'), onPress: () => router.back() },
        ]);
      } else {
        Alert.alert(t('premium.noSubscription'), t('premium.noSubscriptionBody'));
      }
    } catch {
      Alert.alert(t('premium.restoreFailed'), t('premium.restoreFailedBody'));
    } finally {
      setRestoring(false);
    }
  };

  if (isPremiumUser) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppHeader title={t('premium.title')} showBack />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl }}>
          <Text style={{ fontSize: 56 }}>👑</Text>
          <Text style={[styles.heroTitle, { color: colors.onSurface }]}>{t('premium.youArePremium')}</Text>
          <Text style={[typography.body, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
            {t('premium.premiumUnlocked')}
          </Text>
          <Pressable
            style={[styles.cta, { backgroundColor: colors.primary, marginTop: spacing.md }]}
            onPress={() => router.back()}
          >
            <Text style={[typography.label, { fontSize: 15, color: colors.onPrimary }]}>{t('premium.backToApp')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title={t('premium.title')} showBack />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={[styles.hero, { backgroundColor: colors.primary }]}>
          <Text style={{ fontSize: 44 }}>👑</Text>
          <Text style={[styles.heroTitle, { color: colors.onPrimary }]}>{t('premium.heroTitle')}</Text>
          <Text style={[typography.body, { color: colors.onPrimary, opacity: 0.85, textAlign: 'center' }]}>
            {t('premium.heroSub')}
          </Text>
        </View>

        {loadingPkgs ? (
          <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[typography.body, { color: colors.outline, marginTop: spacing.sm }]}>{t('premium.loadingPlans')}</Text>
          </View>
        ) : packages.length === 0 ? (
          <View style={[styles.noPkgs, { backgroundColor: colors.surface }]}>
            <Text style={[typography.body, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
              {t('premium.plansUnavailable')}
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
                  <Text style={[styles.price, { color: isSelected ? colors.onPrimary : colors.onSurface }]} numberOfLines={1} adjustsFontSizeToFit>{price}</Text>
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

        <Text style={[typography.heading, { color: colors.onSurface, marginBottom: spacing.sm }]}>{t('premium.whatsIncluded')}</Text>
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
              {selected ? `Subscribe — ${packageLabel(selected).price}/${packageLabel(selected).sub.split(' ')[1] ?? 'mo'}` : t('premium.selectPlan')}
            </Text>
          )}
        </Pressable>

        <Text style={[typography.body, { fontSize: 11, color: colors.outline, textAlign: 'center', paddingHorizontal: spacing.lg }]}>
          {t('premium.paymentDisclaimer')}
        </Text>

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.xl }}>
          <Pressable onPress={handleRestore} disabled={restoring}>
            <Text style={[typography.label, { fontSize: 13, color: colors.primary }]}>
              {restoring ? t('premium.restoring') : t('premium.restorePurchases')}
            </Text>
          </Pressable>
          <Pressable onPress={() => router.back()}>
            <Text style={[typography.body, { fontSize: 13, color: colors.outline }]}>{t('premium.maybeLater')}</Text>
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
  price: { fontFamily: fonts.headlineSemi, fontSize: 22, textAlign: 'center' },
  noPkgs: { borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center' },
  featureCard: { borderRadius: radius.lg, overflow: 'hidden' },
  featureRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  featureIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 40 + spacing.md * 2 },
  cta: { borderRadius: radius.pill, paddingVertical: 16, paddingHorizontal: spacing.xl, alignItems: 'center', justifyContent: 'center', marginTop: spacing.xs },
});
