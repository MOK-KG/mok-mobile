import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { api } from '@/shared/api/client';
import { sessionToken } from '@/shared/api/token';
import { usePhotoVersion } from '@/shared/lib/photoVersion';

export function PersonPhoto({ id }: { id: string | null | undefined }) {
  const version = usePhotoVersion();
  const [failed, setFailed] = useState<string | null>(null);
  const key = `${id}:${version}`;
  if (!id || !/^\d+$/.test(id) || failed === key) return null;
  const token = sessionToken.get();
  return (
    <Image
      source={{
        uri: api.url(`/staff/photos/${id}`, version ? { v: version } : undefined),
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }}
      cachePolicy="none"
      onError={() => setFailed(key)}
      style={[StyleSheet.absoluteFill, { borderRadius: 999 }]}
      accessibilityIgnoresInvertColors
    />
  );
}
