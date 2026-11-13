import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { sessionToken } from './token';

/**
 * Открыть защищённый файл с бэкенда (вложение задачи, документа, чата, статьи).
 * Системный браузер не передаст токен сессии, поэтому файл скачивается в кэш с заголовком
 * Authorization и открывается системным окном «Поделиться» (там же просмотр).
 */
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
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri);
}

/** Имя файла без разделителей пути: имя приходит с сервера */
const safeName = (name: string) => name.replace(/[/\\]/g, '_').trim() || 'file';
