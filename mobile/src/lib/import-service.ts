import { apiFetch } from './api-client';

export type ImportSourceType = 'url' | 'text';

export interface ExtractedWord {
  zh: string;
  pinyin: string;
  en: string;
  example?: string;
  hskLevel?: number;
}

export interface ImportPreview {
  importId: string;
  sourceTitle: string;
  preview: ExtractedWord[];
}

// Step 1: extract vocabulary from a URL or pasted text (AI-powered, rate-limited 10/hr)
export async function startImport(type: ImportSourceType, source: string): Promise<ImportPreview> {
  const res = await apiFetch('/api/import', {
    method: 'POST',
    body: JSON.stringify({ type, source }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Import failed');
  return data;
}

// Step 2: save the words the user selected from the preview
export async function saveImportedWords(
  importId: string,
  words: ExtractedWord[],
  listId?: string
): Promise<{ saved: number }> {
  const res = await apiFetch('/api/import/save', {
    method: 'POST',
    body: JSON.stringify({ importId, words, listId: listId ?? undefined }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Failed to save words');
  return { saved: data.saved ?? words.length };
}
