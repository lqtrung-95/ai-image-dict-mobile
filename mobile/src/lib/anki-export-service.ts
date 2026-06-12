import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { apiFetch } from './api-client';

// Downloads the Anki-importable TSV from the API and opens the iOS/Android
// share sheet so the user can send it to the Anki app, Files, AirDrop, etc.
export async function exportVocabularyToAnki(): Promise<void> {
  const res = await apiFetch('/api/export/anki');
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? 'Export failed');
  }

  const tsv = await res.text();
  const fileUri = `${FileSystem.cacheDirectory}ai-dictionary-anki-${Date.now()}.txt`;
  await FileSystem.writeAsStringAsync(fileUri, tsv, { encoding: FileSystem.EncodingType.UTF8 });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/tab-separated-values',
      dialogTitle: 'Export vocabulary to Anki',
    });
  } else {
    throw new Error('Sharing is not available on this device');
  }
}
