import { useRef, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, Dimensions, ScrollView, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../src/theme/theme-context';
import { spacing, radius, typography, fonts } from '../src/theme/theme';

const { width: SCREEN_W } = Dimensions.get('window');

export const ONBOARDING_DONE_KEY = '@onboarding_done';

const STEPS = [
  {
    id: 'welcome',
    title: '墨迹 AI Hanzi',
    titleZh: '墨迹',
    subtitle: 'Bridging the ancient art of calligraphy with the precision of neural networks.',
    tagline: 'A nocturnal sanctuary for the modern scholar.',
    cta: 'Get Started',
    secondary: 'Review our philosophy',
    // Decorative calligraphy ink pot icon
    icon: 'create' as const,
  },
  {
    id: 'capture',
    title: 'Capture.',
    subtitle: 'See it. Snap it.',
    body: 'Point your camera at any object to instantly reveal its Hanzi name and pronunciation.',
    cta: 'Next',
    icon: 'photo-camera' as const,
  },
  {
    id: 'library',
    title: 'Learn.',
    subtitle: 'Build your vocabulary.',
    body: 'Save words to your library, practice with SRS flashcards, and track your HSK progress.',
    cta: 'Start Learning',
    icon: 'menu-book' as const,
  },
];

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [step, setStep] = useState(0);

  const finish = async () => {
    await AsyncStorage.setItem(ONBOARDING_DONE_KEY, '1');
    router.replace('/(tabs)');
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      const nextStep = step + 1;
      setStep(nextStep);
      scrollRef.current?.scrollTo({ x: nextStep * SCREEN_W, animated: true });
    } else {
      finish();
    }
  };

  const current = STEPS[step];

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        {/* ── Step 1: Welcome ── */}
        <View style={[styles.page, { width: SCREEN_W }]}>
          <View style={styles.welcomeContent}>
            {/* Icon badge */}
            <View style={[styles.iconBadge, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
              <MaterialIcons name="create" size={32} color={colors.primary} />
            </View>

            <Text style={[styles.welcomeZh, { color: colors.primary }]}>墨迹</Text>
            <Text style={[styles.welcomeTitle, { color: colors.onSurface }]}>AI Hanzi</Text>
            <Text style={[styles.welcomeSubtitle, { color: colors.onSurfaceVariant }]}>
              Bridging the ancient art of calligraphy with the precision of neural networks.
            </Text>
            <Text style={[typography.pinyin, { color: colors.outline, textAlign: 'center', marginTop: 4 }]}>
              A nocturnal sanctuary for the modern scholar.
            </Text>

            {/* Preview card */}
            <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
              <View style={styles.previewInner}>
                <View style={[styles.previewIcon, { backgroundColor: colors.primarySoft }]}>
                  <Text style={{ fontFamily: fonts.hanzi, fontSize: 36, color: colors.primary }}>墨</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.label, { fontSize: 10, color: colors.outline, letterSpacing: 0.5 }]}>
                    ENTRY #482
                  </Text>
                  <Text style={{ fontFamily: fonts.headlineSemi, fontSize: 16, color: colors.onSurface }}>墨 (INK)</Text>
                  <Text style={[typography.pinyin, { color: colors.primary, fontSize: 13 }]}>mò</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ── Step 2: Capture ── */}
        <View style={[styles.page, { width: SCREEN_W }]}>
          <View style={styles.stepContent}>
            <Text style={[styles.stepLabel, { color: colors.primary }]}>Capture.</Text>
            <Text style={[styles.stepSubtitle, { color: colors.onSurfaceVariant }]}>See it. Snap it.</Text>

            {/* Viewfinder mockup */}
            <View style={[styles.viewfinder, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
              <View style={[styles.vfCorner, { top: 12, left: 12, borderRightWidth: 0, borderBottomWidth: 0, borderColor: colors.primary }]} />
              <View style={[styles.vfCorner, { top: 12, right: 12, borderLeftWidth: 0, borderBottomWidth: 0, borderColor: colors.primary }]} />
              <View style={[styles.vfCorner, { bottom: 12, left: 12, borderRightWidth: 0, borderTopWidth: 0, borderColor: colors.primary }]} />
              <View style={[styles.vfCorner, { bottom: 12, right: 12, borderLeftWidth: 0, borderTopWidth: 0, borderColor: colors.primary }]} />
              <View style={[styles.vfDetection, { backgroundColor: 'rgba(0,0,0,0.6)', borderColor: colors.primary }]}>
                <MaterialIcons name="verified" size={18} color={colors.primary} />
                <Text style={[typography.label, { fontSize: 16, color: '#fff', letterSpacing: 1 }]}>树 (SHÙ)</Text>
              </View>
              <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                <Text style={{ fontFamily: fonts.hanzi, fontSize: 80, color: colors.onSurfaceVariant, opacity: 0.15 }}>树</Text>
              </View>
            </View>

            <Text style={[styles.stepBody, { color: colors.onSurfaceVariant }]}>
              Point your camera at any object to instantly reveal its{' '}
              <Text style={{ color: colors.onSurface, fontFamily: fonts.headlineSemi }}>Hanzi</Text>
              {' '}name and pronunciation.
            </Text>
          </View>
        </View>

        {/* ── Step 3: Library ── */}
        <View style={[styles.page, { width: SCREEN_W }]}>
          <View style={styles.stepContent}>
            <Text style={[styles.stepLabel, { color: colors.primary }]}>Learn.</Text>
            <Text style={[styles.stepSubtitle, { color: colors.onSurfaceVariant }]}>Build your vocabulary.</Text>

            {/* Feature pills */}
            <View style={styles.featureList}>
              {[
                { icon: 'bookmark' as const, label: 'Save words as you explore' },
                { icon: 'school' as const, label: 'SRS flashcards for long-term memory' },
                { icon: 'trending-up' as const, label: 'Track your HSK level progress' },
                { icon: 'people' as const, label: 'Community courses & photo stories' },
              ].map((f) => (
                <View key={f.label} style={[styles.featurePill, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
                  <View style={[styles.featureIcon, { backgroundColor: colors.primarySoft }]}>
                    <MaterialIcons name={f.icon} size={18} color={colors.primary} />
                  </View>
                  <Text style={[typography.body, { color: colors.onSurface, flex: 1 }]}>{f.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Bottom controls ── */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        {/* Progress dots */}
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === step ? colors.primary : colors.outlineVariant },
                i === step && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <Pressable
          style={[styles.ctaBtn, { backgroundColor: colors.primary }]}
          onPress={next}
        >
          <Text style={[typography.label, { fontSize: 15, color: colors.onPrimary }]}>
            {step === STEPS.length - 1 ? 'Start Learning' : step === 0 ? 'Get Started' : 'Next'}
          </Text>
          <MaterialIcons name="arrow-forward" size={18} color={colors.onPrimary} />
        </Pressable>

        {step === 0 && (
          <Pressable onPress={finish} style={{ marginTop: spacing.sm }}>
            <Text style={[typography.label, { color: colors.outline, fontSize: 13 }]}>
              Skip intro
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  page: { alignItems: 'center', justifyContent: 'center' },

  // Welcome step
  welcomeContent: { width: SCREEN_W, alignItems: 'center', paddingHorizontal: spacing.xl, gap: spacing.md },
  iconBadge: {
    width: 72, height: 72, borderRadius: 20, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
  },
  welcomeZh: { fontFamily: fonts.hanzi, fontSize: 48, lineHeight: 56 },
  welcomeTitle: { fontFamily: fonts.headlineSemi, fontSize: 36, marginTop: -8 },
  welcomeSubtitle: { ...typography.body, textAlign: 'center', lineHeight: 22, marginTop: spacing.sm },
  previewCard: {
    width: '100%', borderRadius: radius.lg, borderWidth: 1,
    padding: spacing.md, marginTop: spacing.lg,
  },
  previewInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  previewIcon: { width: 64, height: 64, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },

  // Feature steps
  stepContent: { width: SCREEN_W, alignItems: 'center', paddingHorizontal: spacing.xl, gap: spacing.lg },
  stepLabel: { fontFamily: fonts.headlineSemi, fontSize: 40 },
  stepSubtitle: { ...typography.body, fontSize: 16, marginTop: -spacing.sm },
  stepBody: { ...typography.body, textAlign: 'center', lineHeight: 22 },

  // Viewfinder
  viewfinder: {
    width: 240, height: 240, borderRadius: radius.xl, borderWidth: 1,
    overflow: 'hidden', position: 'relative',
  },
  vfCorner: { position: 'absolute', width: 20, height: 20, borderWidth: 2.5 },
  vfDetection: {
    position: 'absolute', bottom: 20, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, borderWidth: 1,
  },

  // Feature list
  featureList: { width: '100%', gap: spacing.sm },
  featurePill: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    borderRadius: radius.lg, borderWidth: 1, padding: spacing.md,
  },
  featureIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  // Footer
  footer: { alignItems: 'center', paddingHorizontal: spacing.containerMargin, gap: spacing.md },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotActive: { width: 20 },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    width: '100%', borderRadius: radius.pill, paddingVertical: 16,
  },
});
