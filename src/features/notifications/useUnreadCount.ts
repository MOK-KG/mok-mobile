import { useMailQueueSummary } from '@/features/tasks/api';
import { useNotifications } from './api';

/** Непрочитанные уведомления; уведомление об очереди считается, только пока очередь не пуста */
export function useUnreadCount() {
  const notifications = useNotifications().data ?? [];
  const queue = useMailQueueSummary().data;
  const queueEmpty = !queue || queue.ready + queue.manual === 0;
  return notifications.filter((n) => !n.read && !(n.kind === 'mailQueue' && queueEmpty)).length;
}
