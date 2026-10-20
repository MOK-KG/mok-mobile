import { useLocalSearchParams } from 'expo-router';
import { RequirePermission } from '@/features/auth';
import { useMailQueue } from '@/features/tasks/api';
import { NewTaskScreen } from '@/features/tasks/new/NewTaskScreen';

/** Новая задача; ?letter=ID — письмо из очереди, которое оформляют вручную */
export default function NewTaskRoute() {
  const { letter: letterId } = useLocalSearchParams<{ letter?: string }>();
  const queue = useMailQueue();
  // Форма заполняется письмом один раз — ждём очередь, если задача из письма
  if (letterId && queue.isPending) return null;
  const letter = letterId ? queue.data?.find((l) => l.id === letterId) : null;
  return (
    <RequirePermission permission="tasks.create">
      <NewTaskScreen letter={letter} />
    </RequirePermission>
  );
}
