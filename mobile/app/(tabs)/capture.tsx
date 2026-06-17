import { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, Image, Animated, Easing } from 'react-native';
import { showError } from '../../src/lib/toast';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/lib/auth-context';
import { analyzePhoto, getTrialUsed, TRIAL_LIMIT } from '../../src/lib/analysis-service';
import { setLatestAnalysisResult } from '../../src/lib/analysis-result-store';
import { Screen, Eyebrow } from '../../src/theme/ui-primitives';
import { useTheme } from '../../src/theme/theme-context';
import { spacing, radius, typography, fonts, makeShadow } from '../../src/theme/theme';

// Always-mounted so it never flickers in — it just becomes visible/invisible.
function AnalyzingOverlay({ uri, visible }: { uri: string | null; visible: boolean }) {
  const { colors } = useTheme();
  const scanY = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.6)).current;

  // Start animations only when overlay becomes visible — resetting to position 0
  // each time so the scan line always begins at the top. Running them while
  // invisible causes native-thread/JS-thread timing drift on slower devices.
  useEffect(() => {
    if (!visible) {
      scanY.setValue(0);
      pulse.setValue(0.6);
      return;
    }
    const scan = Animated.loop(
      Animated.sequence([
        Animated.timing(scanY, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scanY, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    const badge = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.6, duration: 600, useNativeDriver: true }),
      ])
    );
    scan.start();
    badge.start();
    return () => { scan.stop(); badge.stop(); };
  }, [visible, scanY, pulse]);

  const CARD = 300;
  const scanTranslate = scanY.interpolate({ inputRange: [0, 1], outputRange: [0, CARD - 2] });
  const Corner = ({ style }: { style: object }) => (
    <View style={[styles.corner, style, { borderColor: colors.primary }]} />
  );

  if (!visible) return null;

  return (
    // absoluteFill overlay: always on top, never causes the capture screen to re-render
    <View style={[StyleSheet.absoluteFill, styles.analyzingBg, { backgroundColor: colors.background }]}>
      <View style={[styles.photoCard, { width: CARD, height: CARD }]}>
        {uri
          ? <Image source={{ uri }} style={{ width: CARD, height: CARD, borderRadius: radius.lg }} resizeMode="cover" />
          : <View style={{ width: CARD, height: CARD, borderRadius: radius.lg, backgroundColor: colors.surface }} />
        }
        <View style={[StyleSheet.absoluteFill, styles.vignette, { borderRadius: radius.lg }]} />
        <Corner style={{ top: 12, left: 12, borderRightWidth: 0, borderBottomWidth: 0 }} />
        <Corner style={{ top: 12, right: 12, borderLeftWidth: 0, borderBottomWidth: 0 }} />
        <Corner style={{ bottom: 12, left: 12, borderRightWidth: 0, borderTopWidth: 0 }} />
        <Corner style={{ bottom: 12, right: 12, borderLeftWidth: 0, borderTopWidth: 0 }} />
        <Animated.View style={[styles.scanLine, { backgroundColor: colors.primary, transform: [{ translateY: scanTranslate }] }]} />
      </View>
      <Animated.View style={[styles.liveBadge, { backgroundColor: colors.primarySoft, opacity: pulse }]}>
        <View style={[styles.liveDot, { backgroundColor: colors.primary }]} />
        <Text style={[typography.label, { fontSize: 11, color: colors.primary, letterSpacing: 1 }]}>LIVE AI</Text>
      </Animated.View>
      <Text style={[styles.analyzingTitle, { color: colors.onSurface }]}>Analyzing your photo…</Text>
      <Text style={[typography.body, { color: colors.onSurfaceVariant, textAlign: 'center', paddingHorizontal: spacing.xl }]}>
        Detecting objects and translating to Chinese
      </Text>
    </View>
  );
}

export default function CaptureScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [analyzeUri, setAnalyzeUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [trialUsed, setTrialUsed] = useState(0);

  useEffect(() => {
    if (!user) getTrialUsed().then(setTrialUsed);
  }, [user, analyzing]);

  const pickImage = async (fromCamera: boolean) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', fromCamera ? 'Camera access is required to take photos.' : 'Photo library access is required.');
      return;
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.4, base64: true };
    const result = fromCamera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled || !result.assets[0]?.base64) return;

    const asset = result.assets[0];
    // Set both flags together so the overlay becomes visible in a single commit
    setAnalyzeUri(asset.uri);
    setAnalyzing(true);
    try {
      const analysis = await analyzePhoto(`data:image/jpeg;base64,${asset.base64}`, asset.uri, !!user);
      setLatestAnalysisResult(analysis);
      router.push('/analysis-result');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      if (message === 'TRIAL_EXHAUSTED') {
        Alert.alert(
          'Free trial used up',
          `You've used your ${TRIAL_LIMIT} free analysis. Log in to get 3 free analyses per day — or go Premium for unlimited.`,
          [
            { text: 'Not now' },
            { text: 'Log In', onPress: () => router.push('/(auth)/login') },
          ]
        );
      } else if (message === 'DAILY_LIMIT_REACHED') {
        Alert.alert(
          'Daily limit reached',
          "You've used all 3 free analyses today.\n\nUpgrade to Premium for unlimited photo analyses, all courses, and more.",
          [
            { text: 'Maybe later' },
            { text: '✨ Go Premium', onPress: () => router.push('/premium' as never) },
          ]
        );
      } else {
        showError('Analysis failed', message);
      }
    } finally {
      setAnalyzing(false);
      setAnalyzeUri(null);
    }
  };

  return (
    // Render both screens simultaneously; overlay sits on top via absoluteFill.
    // This avoids any conditional-swap flicker when the native picker closes.
    <View style={{ flex: 1 }}>
      <Screen contentStyle={{ justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
        <View style={[styles.heroIcon, { backgroundColor: colors.primarySoft }]}>
          <MaterialIcons name="photo-camera" size={44} color={colors.primary} />
        </View>
        <Text style={{ fontFamily: fonts.hanzi, fontSize: 40, color: colors.onSurface, marginTop: spacing.lg }}>看图识字</Text>
        <Text style={[typography.headline, { color: colors.onSurface, marginTop: spacing.xs }]}>Capture & Learn</Text>
        <Text style={[typography.body, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.xs, paddingHorizontal: spacing.lg }]}>
          Take a photo and AI will teach you the Chinese word for everything in it.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.primaryContainer, ...makeShadow(colors, 'jade') }, pressed && { transform: [{ scale: 0.98 }] }]}
          onPress={() => pickImage(true)}
        >
          <MaterialIcons name="photo-camera" size={22} color={colors.onPrimaryContainer} />
          <Text style={[typography.label, { fontSize: 15, color: colors.onPrimaryContainer }]}>Take Photo</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.secondaryBtn, { backgroundColor: colors.surface, borderColor: colors.outlineVariant, ...makeShadow(colors, 'card') }, pressed && { transform: [{ scale: 0.98 }] }]}
          onPress={() => pickImage(false)}
        >
          <MaterialIcons name="photo-library" size={22} color={colors.onSurfaceVariant} />
          <Text style={[typography.label, { fontSize: 15, color: colors.onSurfaceVariant }]}>Choose from Library</Text>
        </Pressable>
        {!user && (
          <View style={[styles.trialPill, { backgroundColor: colors.primarySoft }]}>
            <Eyebrow>{Math.max(0, TRIAL_LIMIT - trialUsed)} of {TRIAL_LIMIT} free analyses left</Eyebrow>
          </View>
        )}
      </Screen>

      {/* Overlay: mounts once, shown/hidden via the `visible` prop — no tree swap */}
      <AnalyzingOverlay uri={analyzeUri} visible={analyzing} />
    </View>
  );
}

const styles = StyleSheet.create({
  analyzingBg: { alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  photoCard: { borderRadius: radius.lg, overflow: 'hidden', position: 'relative' },
  vignette: { backgroundColor: 'rgba(0,0,0,0.25)' },
  corner: { position: 'absolute', width: 20, height: 20, borderWidth: 2.5 },
  scanLine: { position: 'absolute', left: 0, right: 0, height: 2, opacity: 0.85 },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  analyzingTitle: { fontFamily: fonts.headlineSemi, fontSize: 20, textAlign: 'center' },
  heroIcon: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
    borderRadius: radius.pill, paddingVertical: 16, width: '100%', marginTop: spacing.xl,
  },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
    borderRadius: radius.pill, paddingVertical: 16, width: '100%', marginTop: spacing.md, borderWidth: 1,
  },
  trialPill: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, marginTop: spacing.xl },
});
