import { useLocalSearchParams } from 'expo-router';
import { RequirePermission } from '@/features/auth';
import { TaskScreen } from '@/features/tasks/card/TaskScreen';

/** Карточка задачи по ссылке /tasks/ID — ссылкой можно поделиться */
export default function TaskRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <RequirePermission permission="tasks.view">
      <TaskScreen taskId={id} />
    </RequirePermission>
  );
}
