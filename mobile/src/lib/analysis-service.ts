import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from './api-client';

export interface DetectedWord {
  id: string;
  zh: string;
  en: string;
  pinyin: string;
  category: 'object' | 'color' | 'action';
  hskLevel?: number | null;
  example?: { zh: string; pinyin: string; en: string } | null;
}

export interface AnalysisResult {
  id?: string;
  imageUri: string; // local uri for display
  sceneDescription: string;
  sceneDescriptionZh?: string;
  sceneDescriptionPinyin?: string;
  words: DetectedWord[];
  usage?: { current: number; limit: number; remaining: number } | null;
}

const TRIAL_COUNT_KEY = 'trialAnalysesUsed';
export const TRIAL_LIMIT = 2;

export async function getTrialUsed(): Promise<number> {
  const raw = await AsyncStorage.getItem(TRIAL_COUNT_KEY);
  return raw ? parseInt(raw, 10) : 0;
}

async function incrementTrialUsed(): Promise<void> {
  const used = await getTrialUsed();
  await AsyncStorage.setItem(TRIAL_COUNT_KEY, String(used + 1));
}

interface RawApiObject {
  id?: string;
  zh: string;
  en: string;
  pinyin: string;
  category?: string;
  hskLevel?: number | null;
  hsk_level?: number | null;
  example?: { zh: string; pinyin: string; en: string } | null;
}

function normalizeWords(data: {
  objects?: RawApiObject[];
  exampleSentences?: Record<string, { zh: string; pinyin: string; en: string }>;
  hskLevels?: Record<string, number | null>;
}): DetectedWord[] {
  return (data.objects ?? []).map((obj, i) => ({
    id: obj.id ?? `word-${i}`,
    zh: obj.zh,
    en: obj.en,
    pinyin: obj.pinyin,
    category: (obj.category as DetectedWord['category']) ?? 'object',
    hskLevel: obj.hskLevel ?? obj.hsk_level ?? data.hskLevels?.[obj.zh] ?? null,
    example: obj.example ?? data.exampleSentences?.[obj.zh] ?? null,
  }));
}

// Analyze a photo. Logged-in users hit /api/analyze (6/day server-enforced);
// guests hit /api/analyze-trial with a 2-use client-side counter.
export async function analyzePhoto(
  base64DataUrl: string,
  localUri: string,
  isLoggedIn: boolean
): Promise<AnalysisResult> {
  if (!isLoggedIn) {
    const used = await getTrialUsed();
    if (used >= TRIAL_LIMIT) {
      throw new Error('TRIAL_EXHAUSTED');
    }
  }

  const endpoint = isLoggedIn ? '/api/analyze' : '/api/analyze-trial';
  const res = await apiFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify({ image: base64DataUrl }),
  });

  const data = await res.json();
  if (!res.ok) {
    if (data.code === 'LIMIT_EXCEEDED') throw new Error('DAILY_LIMIT_REACHED');
    throw new Error(data.error ?? 'Analysis failed');
  }

  if (!isLoggedIn) await incrementTrialUsed();

  return {
    id: data.id,
    imageUri: localUri,
    sceneDescription: data.sceneDescription ?? '',
    sceneDescriptionZh: data.sceneDescriptionZh,
    sceneDescriptionPinyin: data.sceneDescriptionPinyin,
    words: normalizeWords(data),
    usage: data.usage ?? null,
  };
}

// Save a detected word into the user's vocabulary library,
// optionally adding it straight into a list
export async function saveWordToVocabulary(word: DetectedWord, listId?: string): Promise<void> {
  const res = await apiFetch('/api/vocabulary', {
    method: 'POST',
    body: JSON.stringify({
      wordZh: word.zh,
      wordPinyin: word.pinyin,
      wordEn: word.en,
      exampleSentence: word.example?.zh ?? undefined,
      hskLevel: word.hskLevel ?? undefined,
      listId: listId ?? undefined,
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? 'Failed to save word');
  }
}
