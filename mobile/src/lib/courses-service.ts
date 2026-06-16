import { apiFetch } from './api-client';

export interface Course {
  id: string;
  name: string;
  description?: string | null;
  difficultyLevel: number;
  subscriberCount: number;
  ratingAvg: number | null;
  ratingCount: number;
  wordCount: number;
  creatorName?: string;
  isSubscribed?: boolean;
  // Present for subscribed courses; drives the progress chip on list cards.
  progress?: { total: number; learned: number; due: number } | null;
}

export type CourseWordState = 'new' | 'learning' | 'mastered';

export interface CourseWord {
  id: string;
  word_zh: string;
  word_pinyin: string;
  word_en: string;
  example_sentence?: string | null;
  hsk_level?: number | null;
  sort_order: number;
  state?: CourseWordState;
}

// Per-course learning progress, derived server-side from the user's SRS deck.
export interface CourseProgress {
  total: number;
  learned: number;
  learning: number;
  due: number;
}

export interface CourseDetail {
  course: Course;
  words: CourseWord[];
  progress?: CourseProgress;
  isSubscribed?: boolean;
  userRating?: { rating: number } | null;
}

export type CourseSort = 'newest' | 'popular' | 'rating';

export async function fetchCourses(opts: {
  page?: number;
  difficulty?: string;
  sort?: CourseSort;
  q?: string;
}): Promise<{ courses: Course[]; totalPages: number }> {
  const params = new URLSearchParams();
  params.set('page', String(opts.page ?? 1));
  if (opts.difficulty && opts.difficulty !== 'all') params.set('difficulty', opts.difficulty);
  if (opts.sort) params.set('sort', opts.sort);
  if (opts.q) params.set('q', opts.q);

  const res = await apiFetch(`/api/courses?${params}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Failed to load courses');
  return { courses: data.courses ?? [], totalPages: data.totalPages ?? 1 };
}

export async function fetchCourseDetail(id: string, url?: string): Promise<CourseDetail> {
  const res = await apiFetch(url ?? `/api/courses/${id}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Failed to load course');
  return data;
}

export async function subscribeToCourse(id: string): Promise<void> {
  const res = await apiFetch(`/api/courses/${id}/subscribe`, { method: 'POST' });
  if (!res.ok && res.status !== 409) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? 'Failed to subscribe');
  }
}

export async function unsubscribeFromCourse(id: string): Promise<void> {
  const res = await apiFetch(`/api/courses/${id}/subscribe`, { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? 'Failed to unsubscribe');
  }
}

export async function rateCourse(id: string, rating: number): Promise<void> {
  const res = await apiFetch(`/api/courses/${id}/rate`, {
    method: 'POST',
    body: JSON.stringify({ rating }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? 'Failed to rate course');
  }
}
