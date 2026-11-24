import { useLocalSearchParams } from 'expo-router';
import { RequirePermission } from '@/features/auth';
import { RolePermissionsScreen } from '@/features/roles/RoleMatrixScreen';

export default function RolePermissionsRoute() {
  const { code } = useLocalSearchParams<{ code: string }>();
  return (
    <RequirePermission permission="staff.view">
      <RolePermissionsScreen code={code} />
    </RequirePermission>
  );
}
