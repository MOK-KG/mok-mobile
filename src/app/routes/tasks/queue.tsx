import { RequirePermission } from '@/features/auth';
import { QueueScreen } from '@/features/tasks/queue/QueueScreen';

export default function QueueRoute() {
  return (
    <RequirePermission permission="tasks.create">
      <QueueScreen />
    </RequirePermission>
  );
}
