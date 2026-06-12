import * as Speech from 'expo-speech';
import { setAudioModeAsync } from 'expo-audio';

// iOS plays TTS through the "ambient" audio session by default, which the
// ring/silent switch mutes. Switching to playback mode makes pronunciation
// audible even in silent mode — expected behavior for a language-learning app.
let audioModeReady: Promise<void> | null = null;

function ensurePlaybackAudioMode(): Promise<void> {
  if (!audioModeReady) {
    audioModeReady = setAudioModeAsync({ playsInSilentMode: true }).catch((err) => {
      console.log('Failed to set audio mode:', err);
      audioModeReady = null; // retry on next speak
    }) as Promise<void>;
  }
  return audioModeReady;
}

export async function speakChinese(text: string | null | undefined): Promise<void> {
  if (!text) return; // never pass undefined to the native module — it throws
  await ensurePlaybackAudioMode();
  Speech.stop();
  Speech.speak(text, { language: 'zh-CN', rate: 0.8 });
}
