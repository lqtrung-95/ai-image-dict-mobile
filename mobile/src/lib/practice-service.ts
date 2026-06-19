import { apiFetch } from './api-client';

// Word due for review, returned camelCase by /api/practice/due-words.
// courseProgressId is set when practicing a course word — the server uses it
// to update user_course_word_progress instead of vocabulary_items.
export interface DueWord {
  id: string;
  courseProgressId?: string | null; // present only for course practice words
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

export async function fetchDueWords(limit = 20, courseId?: string, locale = 'en'): Promise<DueWordsResponse> {
  const params = new URLSearchParams({ limit: String(limit), locale });
  if (courseId) params.set('course', courseId);
  const res = await apiFetch(`/api/practice/due-words?${params}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Failed to load practice words');
  return data;
}

// Record a rating; the server runs SM-2 and reschedules the word.
// Pass courseProgressId (instead of vocabularyItemId) for course words.
export async function submitAttempt(
  itemId: string,
  rating: SrsRating,
  responseTimeMs?: number,
  isCourseWord = false
): Promise<void> {
  const body = isCourseWord
    ? { courseProgressId: itemId, quizMode: 'flashcard', rating, responseTimeMs }
    : { vocabularyItemId: itemId, quizMode: 'flashcard', rating, responseTimeMs };

  const res = await apiFetch('/api/word-attempts', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? 'Failed to record attempt');
  }
}
