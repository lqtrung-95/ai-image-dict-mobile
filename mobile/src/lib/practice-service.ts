import { apiFetch } from './api-client';

// Word due for review, returned camelCase by /api/practice/due-words
export interface DueWord {
  id: string;
  wordZh: string;
  wordPinyin: string;
  wordEn: string;
  exampleSentence?: string | null;
  exampleSentencePinyin?: string | null;
  exampleSentenceEn?: string | null;
  hskLevel?: number | null;
  repetitions?: number;
  intervalDays?: number;
  photoUrl?: string | null;
}

export interface DueWordsResponse {
  items: DueWord[];
  dueCount: number;
  newCount: number;
  total: number;
}

export type SrsRating = 1 | 2 | 3 | 4; // Again / Hard / Good / Easy

export async function fetchDueWords(limit = 20, courseId?: string): Promise<DueWordsResponse> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (courseId) params.set('course', courseId);
  const res = await apiFetch(`/api/practice/due-words?${params}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Failed to load practice words');
  return data;
}

// Record a rating; the server runs SM-2 and reschedules the word
export async function submitAttempt(
  vocabularyItemId: string,
  rating: SrsRating,
  responseTimeMs?: number
): Promise<void> {
  const res = await apiFetch('/api/word-attempts', {
    method: 'POST',
    body: JSON.stringify({
      vocabularyItemId,
      quizMode: 'flashcard',
      rating,
      responseTimeMs,
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? 'Failed to record attempt');
  }
}
