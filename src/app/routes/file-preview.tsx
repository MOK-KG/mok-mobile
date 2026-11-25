import { useLocalSearchParams } from 'expo-router';
import { FilePreviewScreen } from '@/features/files/FilePreviewScreen';

export default function FilePreviewRoute() {
  const { uri, name } = useLocalSearchParams<{ uri: string; name: string }>();
  return <FilePreviewScreen uri={uri} name={name ?? ''} />;
}
