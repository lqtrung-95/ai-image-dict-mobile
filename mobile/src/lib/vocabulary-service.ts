import { apiFetch } from './api-client';

// Shape returned by the existing /api/vocabulary endpoint (camelCase-mapped)
export interface VocabularyItem {
  id: string;
  wordZh: string;
  wordPinyin: string;
  wordEn: string;
  exampleSentence?: string | null;
  hskLevel?: number | null;
  isLearned: boolean;
  createdAt: string;
  photoUrl?: string | null;
}

export interface VocabularyPage {
  items: VocabularyItem[];
  total: number;
  hasMore: boolean;
}

const PAGE_SIZE = 50;

export async function fetchVocabulary(
  search: string,
  offset: number,
  listId?: string
): Promise<VocabularyPage> {
  const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
  if (search.trim()) params.set('q', search.trim());
  if (listId) params.set('list', listId);

  const res = await apiFetch(`/api/vocabulary?${params}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Failed to load vocabulary');
  return data;
}

export async function setWordLearned(id: string, isLearned: boolean): Promise<void> {
  const res = await apiFetch(`/api/vocabulary/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ isLearned }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? 'Failed to update word');
  }
}

export async function deleteWord(id: string): Promise<void> {
  const res = await apiFetch(`/api/vocabulary/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? 'Failed to delete word');
  }
}
