import { RequirePermission } from '@/features/auth';
import { RolesScreen } from '@/features/roles/RolesScreen';

/** Роли и доступ — из вкладки «Ещё»; без права — 403 */
export default function AccessRoute() {
  return (
    <RequirePermission permission="staff.view">
      <RolesScreen />
    </RequirePermission>
  );
}
