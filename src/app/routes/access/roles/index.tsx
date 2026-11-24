import { RequirePermission } from '@/features/auth';
import { RoleListScreen } from '@/features/roles/RoleMatrixScreen';

export default function RoleListRoute() {
  return (
    <RequirePermission permission="staff.view">
      <RoleListScreen />
    </RequirePermission>
  );
}
