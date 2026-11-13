export type PickedFile = { uri: string; name: string; mimeType?: string | null };

export const toUpload = (file: PickedFile): File =>
  ({
    uri: file.uri,
    name: file.name,
    type: file.mimeType || 'application/octet-stream',
  }) as unknown as File;
