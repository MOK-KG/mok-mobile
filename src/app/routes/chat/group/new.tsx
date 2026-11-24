import { RequirePermission } from '@/features/auth';
import { NewGroupScreen } from '@/features/chat/NewGroupScreen';

export default function NewGroupRoute() {
  return (
    <RequirePermission permission="chat.use">
      <NewGroupScreen />
    </RequirePermission>
  );
}
