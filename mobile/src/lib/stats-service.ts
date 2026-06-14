import { apiFetch } from './api-client';

export interface UserStats {
  currentStreak: number;
  longestStreak: number;
  totalWords: number;
  learnedWords: number;
  totalPracticeSessions: number;
  dueToday: number;
  masteredThisWeek: number;
  hskDistribution: Record<string, number>; // hsk1..hsk6, unclassified
  wordsPerDay: { date: string; count: number }[];
  reviewForecast: { date: string; count: number }[];
}

export async function fetchStats(): Promise<UserStats> {
  const res = await apiFetch('/api/stats');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Failed to load stats');
  return data;
}

export interface WordsByState {
  new: number;
  learning: number;
  reviewing: number;
  mastered: number;
}

export async function fetchWordsByState(): Promise<WordsByState | null> {
  const res = await apiFetch('/api/stats/detailed');
  if (!res.ok) return null;
  const data = await res.json();
  return data.wordsByState ?? null;
}

// ---- Daily goals ----

export interface DailyGoal {
  id: string;
  goal_type: 'words_learned' | 'practice_minutes' | 'reviews_completed';
  target_value: number;
  is_active: boolean;
}

export interface DailyGoalsResponse {
  goals: DailyGoal[];
  progress: Record<string, number>;
}

export async function fetchDailyGoals(): Promise<DailyGoalsResponse> {
  const res = await apiFetch('/api/daily-goals');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Failed to load goals');
  return data;
}

export async function setDailyGoal(
  goalType: DailyGoal['goal_type'],
  targetValue: number
): Promise<void> {
  const res = await apiFetch('/api/daily-goals', {
    method: 'POST',
    body: JSON.stringify({ goalType, targetValue }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? 'Failed to save goal');
  }
}

// ---- Word of the day ----

export interface WordOfDay {
  word_zh: string;
  word_pinyin: string;
  word_en: string;
  example_sentence?: string | null;
  hsk_level?: number | null;
}

export interface WordOfDayResponse {
  word: WordOfDay;
  alreadySaved: boolean;
}

export async function fetchWordOfDay(): Promise<WordOfDayResponse | null> {
  const res = await apiFetch('/api/word-of-day');
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.word) return null;
  return { word: data.word, alreadySaved: data.alreadySaved ?? false };
}

// Save the word of the day into the user's vocabulary library
export async function saveWordOfDay(word: WordOfDay): Promise<void> {
  const res = await apiFetch('/api/vocabulary', {
    method: 'POST',
    body: JSON.stringify({
      wordZh: word.word_zh,
      wordPinyin: word.word_pinyin,
      wordEn: word.word_en,
      exampleSentence: word.example_sentence ?? undefined,
      hskLevel: word.hsk_level ?? undefined,
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? 'Failed to save word');
  }
}
