import { supabase } from './supabase-client';

// Base URL of the existing ai-image-dict Next.js API (deployed web app).
// Set EXPO_PUBLIC_API_URL in .env, e.g. https://ai-image-dict.vercel.app
const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('Missing EXPO_PUBLIC_API_URL — set it in mobile/.env');
}

// Authenticated fetch against the Next.js API routes.
// Supabase JS auto-refreshes the session; we just attach the current access token.
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
}
