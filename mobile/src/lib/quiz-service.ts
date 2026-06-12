import { apiFetch } from './api-client';
import { fetchVocabulary, VocabularyItem } from './vocabulary-service';

export type QuizMode = 'multiple-choice' | 'listening' | 'pinyin';

export interface QuizQuestion {
  word: VocabularyItem;
  // For multiple-choice / listening: 4 English options, one correct
  options: string[];
  correctIndex: number;
}

// Pull a pool of words to build a quiz from. Needs >= 4 for distractors.
async function fetchQuizPool(): Promise<VocabularyItem[]> {
  const page = await fetchVocabulary('', 0);
  return page.items;
}

export const MIN_WORDS_FOR_QUIZ = 4;

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Build a multiple-choice / listening quiz: each question picks 3 distractor
// English meanings from other words in the pool.
export function buildChoiceQuestions(
  pool: VocabularyItem[],
  count = 10
): QuizQuestion[] {
  const words = shuffle(pool).slice(0, count);
  return words.map((word) => {
    const distractors = shuffle(pool.filter((w) => w.id !== word.id))
      .slice(0, 3)
      .map((w) => w.wordEn);
    const options = shuffle([word.wordEn, ...distractors]);
    return { word, options, correctIndex: options.indexOf(word.wordEn) };
  });
}

// Type-pinyin quiz needs no options — user types the answer
export function buildPinyinQuestions(
  pool: VocabularyItem[],
  count = 10
): QuizQuestion[] {
  return shuffle(pool)
    .slice(0, count)
    .map((word) => ({ word, options: [], correctIndex: -1 }));
}

export async function loadQuizPool(): Promise<VocabularyItem[]> {
  return fetchQuizPool();
}

// Normalize pinyin for comparison: drop tone marks, spaces, punctuation, case.
// Accepts "pin yin", "pinyin", "PĪNYĪN" etc. as equivalent.
export function normalizePinyin(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip tone diacritics
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();
}

export function isPinyinCorrect(answer: string, expected: string): boolean {
  return normalizePinyin(answer) === normalizePinyin(expected);
}

// Record a quiz answer through the same SRS endpoint used by flashcards.
// Correct → "Good" (3); incorrect → "Again" (1).
export async function recordQuizAnswer(
  vocabularyItemId: string,
  correct: boolean,
  quizMode: QuizMode
): Promise<void> {
  await apiFetch('/api/word-attempts', {
    method: 'POST',
    body: JSON.stringify({
      vocabularyItemId,
      quizMode,
      rating: correct ? 3 : 1,
    }),
  }).catch(() => {
    // Quiz scoring is best-effort; don't interrupt the session on a failed save
  });
}
