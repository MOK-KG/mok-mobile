import { useCan } from '@/features/auth';
import { useMailQueueSummary } from '@/features/tasks/api';
import { canSeeNotification, useNotifications } from './api';

/**
 * Непрочитанные уведомления: только те, что можно открыть при правах пользователя;
 * уведомление об очереди считается, только пока очередь не пуста
 */
export function useUnreadCount() {
  const { can } = useCan();
  const notifications = (useNotifications().data ?? []).filter((n) => canSeeNotification(n, can));
  const queue = useMailQueueSummary().data;
  const queueEmpty = !queue || queue.ready + queue.manual === 0;
  return notifications.filter((n) => !n.read && !(n.kind === 'mailQueue' && queueEmpty)).length;
}
