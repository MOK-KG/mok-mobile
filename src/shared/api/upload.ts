/**
 * Файл для FormData в React Native. Общие с web файлы (features/{chat,tasks,…}/api.ts)
 * ждут `File`, а в RN FormData принимает объект { uri, name, type } — по сети уходит тот же
 * multipart. Приведение типа — только здесь, в одном месте.
 */
export type PickedFile = { uri: string; name: string; mimeType?: string | null };

export const toUpload = (file: PickedFile): File =>
  ({
    uri: file.uri,
    name: file.name,
    type: file.mimeType || 'application/octet-stream',
  }) as unknown as File;
