import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { toast } from '@/shared/lib/toast';
import { useTasks } from './api';

/**
 * Открыть карточку задачи по названию — так на задачу ссылаются чат и уведомления,
 * пока у них нет ID задачи (появится с бэкендом). Задачи нет — тост, а не пустой экран.
 */
export function useOpenTaskByTitle() {
  const { t } = useTranslation();
  const active = useTasks('department').data;
  const done = useTasks('completed').data;
  return (title: string) => {
    const task = [...(active ?? []), ...(done ?? [])].find((x) => x.title === title);
    if (task) router.push(`/tasks/${task.id}`);
    else toast.warning({ title: t('notifications.taskGone') });
  };
}
