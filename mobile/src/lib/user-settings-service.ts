import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
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
