import { useQuery } from '@tanstack/react-query';
import { createMockTasks, currentUserId } from './mock';
import type { Task, TaskTab } from './types';

/**
 * Данные задач на мобильном. Пока бэкенда нет — та же заглушка, что и в web (mock.ts);
 * когда появится API, меняются только функции загрузки.
 */
let store = createMockTasks();

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function resetTasksMock() {
  store = createMockTasks();
}

function tasksFor(tab: TaskTab): Task[] {
  switch (tab) {
    case 'mine':
      return store.department.filter((t) => t.assignee?.id === currentUserId);
    case 'department':
      return store.department;
    case 'createdByMe':
      return store.department.filter((t) => t.author.id === currentUserId);
    case 'completed':
      return store.archive;
  }
}

export const tasksKey = ['tasks'] as const;

export function useTasks(tab: TaskTab) {
  return useQuery({
    queryKey: [...tasksKey, tab],
    queryFn: async () => {
      await delay(120);
      // Копии, как от настоящего API
      return structuredClone(tasksFor(tab));
    },
  });
}
