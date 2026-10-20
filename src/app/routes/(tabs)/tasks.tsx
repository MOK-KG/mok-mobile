import { RequirePermission } from '@/features/auth';
import { TasksScreen } from '@/features/tasks/TasksScreen';

export default function TasksRoute() {
  return (
    <RequirePermission permission="tasks.view">
      <TasksScreen />
    </RequirePermission>
  );
}
