import { apiFetch } from './api-client';
import { loadQuizPool } from './quiz-service';
import type { VocabularyItem } from './vocabulary-service';

export { loadQuizPool };
export const MIN_WORDS_FOR_HANDWRITING = 1;

// Match CJK ideographs only — strips punctuation/latin so we trace real characters.
const CJK = /[㐀-鿿豈-﫿]/;

/** Split a word into its individual traceable characters (skips punctuation). */
export function splitCharacters(wordZh: string): string[] {
  return Array.from(wordZh).filter((ch) => CJK.test(ch));
}

/** Words that contain at least one traceable character. */
export function traceableWords(pool: VocabularyItem[]): VocabularyItem[] {
  return pool.filter((w) => splitCharacters(w.wordZh).length > 0);
}

// Best-effort attempt recording; quiz_mode is free-text varchar on the backend.
export async function recordHandwritingAttempt(
  vocabularyItemId: string,
  correct: boolean
): Promise<void> {
  await apiFetch('/api/word-attempts', {
    method: 'POST',
    body: JSON.stringify({
      vocabularyItemId,
      quizMode: 'handwriting',
      rating: correct ? 3 : 1,
    }),
  }).catch(() => {
    // Practice scoring is best-effort; never interrupt the session on a failed save
  });
}
