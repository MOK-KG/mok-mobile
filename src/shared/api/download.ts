import { Directory, File, Paths } from 'expo-file-system';
import { type Href, router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { isPreviewable } from '@/shared/lib/files';
import { sessionToken } from './token';

export async function openProtectedFile(url: string, name: string): Promise<void> {
  const folder = new Directory(Paths.cache, 'downloads');
  folder.create({ idempotent: true, intermediates: true });
  const target = new File(folder, safeName(name));
  if (target.exists) target.delete();

  const token = sessionToken.get();
  const task = File.createDownloadTask(url, target, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const file = await task.downloadAsync();
  if (!file) return;
  if (Platform.OS === 'ios' && isPreviewable(name)) {
    router.push({ pathname: '/file-preview', params: { uri: file.uri, name } } as unknown as Href);
    return;
  }
  await shareFile(file.uri);
}

export async function shareFile(uri: string): Promise<void> {
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
}

const safeName = (name: string) => name.replace(/[/\\]/g, '_').trim() || 'file';
