import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/lib/auth-context';
import {
  analyzePhoto, getTrialUsed, TRIAL_LIMIT,
} from '../../src/lib/analysis-service';
import { setLatestAnalysisResult } from '../../src/lib/analysis-result-store';

export default function CaptureScreen() {
  const { user } = useAuth();
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
      Alert.alert(
        'Permission needed',
        fromCamera
          ? 'Camera access is required to take photos.'
          : 'Photo library access is required to choose images.'
      );
      return;
    }

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      quality: 0.4, // keep base64 payload well under the API's 10mb JSON limit
      base64: true,
    };

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (result.canceled || !result.assets[0]?.base64) return;

    const asset = result.assets[0];
    setPreviewUri(asset.uri);
    setAnalyzing(true);

    try {
      const analysis = await analyzePhoto(
        `data:image/jpeg;base64,${asset.base64}`,
        asset.uri,
        !!user
      );
      setLatestAnalysisResult(analysis);
      router.push('/analysis-result');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      if (message === 'TRIAL_EXHAUSTED') {
        Alert.alert(
          'Free trial used up',
          `You've used your ${TRIAL_LIMIT} free analyses. Log in to continue (6 free per day).`,
          [
            { text: 'Not now' },
            { text: 'Log In', onPress: () => router.push('/(auth)/login') },
          ]
        );
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
      <View style={[styles.container, styles.centered]}>
        {previewUri && <Image source={{ uri: previewUri }} style={styles.preview} />}
        <ActivityIndicator size="large" color="#a855f7" style={{ marginTop: 24 }} />
        <Text style={styles.analyzingText}>Analyzing your photo…</Text>
        <Text style={styles.analyzingSubtext}>Detecting objects and translating to Chinese</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.centered]}>
      <Text style={styles.emoji}>📷</Text>
      <Text style={styles.title}>Capture & Learn</Text>
      <Text style={styles.subtitle}>
        Take a photo and AI will teach you the Chinese words for everything in it.
      </Text>

      <TouchableOpacity style={styles.primaryButton} onPress={() => pickImage(true)}>
        <Text style={styles.primaryButtonText}>📸  Take Photo</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} onPress={() => pickImage(false)}>
        <Text style={styles.secondaryButtonText}>🖼  Choose from Library</Text>
      </TouchableOpacity>

      {!user && (
        <Text style={styles.trialText}>
          Free trial: {Math.max(0, TRIAL_LIMIT - trialUsed)} of {TRIAL_LIMIT} analyses left
          {'\n'}Log in for 6 free analyses per day
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 24 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#94a3b8', textAlign: 'center', marginBottom: 32 },
  primaryButton: {
    backgroundColor: '#9333ea', borderRadius: 14, paddingVertical: 16,
    paddingHorizontal: 32, width: '100%', marginBottom: 12,
  },
  primaryButtonText: { color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 17 },
  secondaryButton: {
    backgroundColor: '#1e293b', borderRadius: 14, paddingVertical: 16,
    paddingHorizontal: 32, width: '100%', borderWidth: 1, borderColor: '#334155',
  },
  secondaryButtonText: { color: '#e2e8f0', textAlign: 'center', fontWeight: '600', fontSize: 17 },
  trialText: { color: '#64748b', fontSize: 13, textAlign: 'center', marginTop: 24, lineHeight: 20 },
  preview: { width: 200, height: 200, borderRadius: 16 },
  analyzingText: { color: '#fff', fontSize: 18, fontWeight: '600', marginTop: 16 },
  analyzingSubtext: { color: '#94a3b8', fontSize: 14, marginTop: 4 },
});
