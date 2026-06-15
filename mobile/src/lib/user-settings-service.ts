import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { supabase } from './supabase-client';
import { apiFetch } from './api-client';

export interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export async function fetchProfile(): Promise<UserProfile> {
  const res = await apiFetch('/api/user/profile');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Failed to load profile');
  return data.profile;
}

export async function updateDisplayName(displayName: string): Promise<void> {
  const res = await apiFetch('/api/user/profile', {
    method: 'PATCH',
    body: JSON.stringify({ displayName }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? 'Failed to update profile');
  }
  // Sync to auth user_metadata so AuthContext picks up the change immediately
  // and the new name persists across app restarts (sessionToUser reads user_metadata).
  await supabase.auth.updateUser({ data: { display_name: displayName } });
}

// GDPR-style full data export: downloads JSON and opens the share sheet
export async function exportAllUserData(): Promise<void> {
  const res = await apiFetch('/api/user/export');
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? 'Export failed');
  }
  const json = await res.text();
  const fileUri = `${FileSystem.cacheDirectory}my-data-export-${Date.now()}.json`;
  await FileSystem.writeAsStringAsync(fileUri, json, { encoding: FileSystem.EncodingType.UTF8 });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, { mimeType: 'application/json', dialogTitle: 'Export my data' });
  }
}

// Upload a local image URI as the user's avatar; returns the new public avatar_url
export async function uploadAvatar(localUri: string): Promise<string> {
  const API_URL = process.env.EXPO_PUBLIC_API_URL!;
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const formData = new FormData();
  formData.append('avatar', {
    uri: localUri,
    name: 'avatar.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);

  const res = await fetch(`${API_URL}/api/user/avatar`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const data2 = await res.json();
  if (!res.ok) throw new Error(data2.error ?? 'Avatar upload failed');
  const avatarUrl = data2.avatarUrl as string;
  // Sync to user_metadata so AuthContext (and AppHeader) update immediately.
  await supabase.auth.updateUser({ data: { avatar_url: avatarUrl } });
  return avatarUrl;
}

// Permanently deletes the account; the API requires this exact confirmation string
export async function deleteAccount(): Promise<void> {
  const res = await apiFetch('/api/user/delete', {
    method: 'POST',
    body: JSON.stringify({ confirmation: 'DELETE_MY_ACCOUNT' }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? 'Failed to delete account');
  }
}
