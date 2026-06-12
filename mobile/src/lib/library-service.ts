import { apiFetch } from './api-client';

// ---- Vocabulary Lists ----

export interface VocabularyList {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  is_public: boolean;
  created_at: string;
  wordCount: number;
  learnedCount: number;
}

export async function fetchLists(): Promise<VocabularyList[]> {
  const res = await apiFetch('/api/lists');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Failed to load lists');
  return data;
}

export async function createList(name: string, color: string): Promise<VocabularyList> {
  const res = await apiFetch('/api/lists', {
    method: 'POST',
    body: JSON.stringify({ name, color }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Failed to create list');
  return data;
}

export async function deleteList(id: string): Promise<void> {
  const res = await apiFetch(`/api/lists/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete list');
}

// ---- Analysis History ----

export interface HistoryWord {
  id: string;
  zh: string;
  en: string;
  pinyin: string;
  category: string;
}

export interface HistoryAnalysis {
  id: string;
  image_url: string;
  scene_context?: { description?: string } | null;
  created_at: string;
  detected_objects: HistoryWord[];
}

export async function fetchHistory(): Promise<HistoryAnalysis[]> {
  const res = await apiFetch('/api/history');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Failed to load history');
  return data.analyses ?? [];
}

// The history list endpoint returns only word IDs; this detail endpoint
// returns the full word data (zh/en/pinyin) — used when a card is expanded.
export async function fetchAnalysisDetail(id: string): Promise<HistoryAnalysis> {
  const res = await apiFetch(`/api/history/${id}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Failed to load analysis');
  return data.analysis;
}

export async function deleteAnalysis(id: string): Promise<void> {
  const res = await apiFetch(`/api/history/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete analysis');
}

// ---- Photo Stories ----

export interface PhotoStory {
  id: string;
  title: string;
  description?: string | null;
  cover_image_url?: string | null;
  created_at: string;
  photoCount: number;
}

export async function fetchStories(): Promise<PhotoStory[]> {
  const res = await apiFetch('/api/stories');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Failed to load stories');
  return data.stories ?? [];
}

export async function createStory(
  title: string,
  description: string,
  photoIds: string[]
): Promise<PhotoStory> {
  const res = await apiFetch('/api/stories', {
    method: 'POST',
    body: JSON.stringify({ title, description, photoIds }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Failed to create story');
  return data.story;
}

export interface StoryPhotoVocab {
  id: string;
  label_zh: string;
  label_en: string;
  pinyin: string;
  category: string;
}

export interface StoryPhoto {
  story_photo_id: string;
  caption?: string | null;
  id: string;
  image_url: string;
  created_at: string;
  vocabulary: StoryPhotoVocab[];
}

export interface StoryDetail extends PhotoStory {
  photos: StoryPhoto[];
  vocabularyCount: number;
}

export async function fetchStoryDetail(id: string): Promise<StoryDetail> {
  const res = await apiFetch(`/api/stories/${id}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Failed to load story');
  return data.story;
}

export interface NarrativeSentence {
  zh: string;
  pinyin: string;
  en: string;
}

export interface StoryNarrative {
  sentences: NarrativeSentence[];
  wordsUsed: string[];
}

// AI writes a short Chinese story weaving in the story photos' vocabulary.
// Not persisted server-side; cache per session on the client.
export async function generateNarrative(storyId: string): Promise<StoryNarrative> {
  const res = await apiFetch(`/api/stories/${storyId}/narrative`, { method: 'POST' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Failed to generate story');
  return data.narrative;
}

export async function deleteStory(id: string): Promise<void> {
  const res = await apiFetch(`/api/stories/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete story');
}
