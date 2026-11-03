import { useLocalSearchParams } from 'expo-router';
import { RequirePermission } from '@/features/auth';
import { DocumentScreen } from '@/features/documents/DocumentScreen';

/** Карточка документа по ссылке /documents/ID */
export default function DocumentRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <RequirePermission permission="documents.view">
      <DocumentScreen docId={id} />
    </RequirePermission>
  );
}
