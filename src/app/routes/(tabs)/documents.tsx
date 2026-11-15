import { RequirePermission } from '@/features/auth';
import { DocumentsScreen } from '@/features/documents/DocumentsScreen';

export default function DocumentsRoute() {
  return (
    <RequirePermission permission="documents.view">
      <DocumentsScreen />
    </RequirePermission>
  );
}
