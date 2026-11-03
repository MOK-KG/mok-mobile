import { useLocalSearchParams } from 'expo-router';
import { RequirePermission } from '@/features/auth';
import { StaffScreen } from '@/features/roles/StaffScreen';

/** Карточка сотрудника по ссылке /access/ID */
export default function StaffRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <RequirePermission permission="staff.view">
      <StaffScreen staffId={id} />
    </RequirePermission>
  );
}
