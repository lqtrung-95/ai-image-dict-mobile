import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/lib/auth-context';
import { analyzePhoto, getTrialUsed, TRIAL_LIMIT } from '../../src/lib/analysis-service';
import { setLatestAnalysisResult } from '../../src/lib/analysis-result-store';
import { Screen, Eyebrow } from '../../src/theme/ui-primitives';
import { useTheme } from '../../src/theme/theme-context';
import { spacing, radius, typography, fonts, makeShadow } from '../../src/theme/theme';

export default function CaptureScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [analyzing, setAnalyzing] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
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
    setPreviewUri(asset.uri);
    setAnalyzing(true);
    try {
      const analysis = await analyzePhoto(`data:image/jpeg;base64,${asset.base64}`, asset.uri, !!user);
      setLatestAnalysisResult(analysis);
      router.push('/analysis-result');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      if (message === 'TRIAL_EXHAUSTED') {
        Alert.alert('Free trial used up', `You've used your ${TRIAL_LIMIT} free analyses. Log in to continue (6 free per day).`, [
          { text: 'Not now' }, { text: 'Log In', onPress: () => router.push('/(auth)/login') },
        ]);
      } else if (message === 'DAILY_LIMIT_REACHED') {
        Alert.alert('Daily limit reached', "You've used all 6 free analyses today. Come back tomorrow!");
      } else {
        Alert.alert('Analysis failed', message);
      }
    } finally {
      setAnalyzing(false);
      setPreviewUri(null);
    }
  };

  if (analyzing) {
    return (
      <Screen contentStyle={{ justifyContent: 'center', alignItems: 'center' }}>
        {previewUri && <Image source={{ uri: previewUri }} style={styles.preview} />}
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.lg }} />
        <Text style={[typography.heading, { color: colors.onSurface, marginTop: spacing.md }]}>Analyzing your photo…</Text>
        <Text style={[typography.body, { color: colors.onSurfaceVariant, marginTop: 4 }]}>Detecting objects and translating to Chinese</Text>
      </Screen>
    );
  }

  return (
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
  );
}

const styles = StyleSheet.create({
  heroIcon: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  preview: { width: 200, height: 200, borderRadius: radius.lg },
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
