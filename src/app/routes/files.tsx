import { RequirePermission } from '@/features/auth';
import { FilesScreen } from '@/features/files/FilesScreen';

/** Файлы — из вкладки «Ещё»; без права — 403 */
export default function FilesRoute() {
  return (
    <RequirePermission permission="files.view">
      <FilesScreen />
    </RequirePermission>
  );
}
