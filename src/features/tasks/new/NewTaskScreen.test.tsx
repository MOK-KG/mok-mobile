import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { fakeApi } from '@/test/fakeApi';
import { renderScreen } from '@/test/render';
import { NewTaskScreen } from './NewTaskScreen';

const person = {
  id: 9,
  email: 'nb@olympic.kg',
  name: 'Нурлан Бакиров',
  position: 'Специалист',
  department: 'Медицинский',
};

const created = {
  id: 't-9',
  code: 'ЗД-2026-0009',
  title: 'Подготовить смету на сборы',
  status: 'queue',
  columnId: 'c-1',
  position: 0,
  project: null,
  due: null,
  assignee: person,
  author: person,
  deputy: null,
  priority: 'normal',
  subtasks: 0,
  comments: 0,
  attachments: 0,
  fromEmail: false,
  reschedules: 0,
  escalationHours: null,
  description: '',
  knowledgeLink: null,
  subtaskItems: [],
  commentItems: [],
  attachmentItems: [],
  history: [],
  rescheduleLog: [],
  reminderDays: 3,
  escalatedAt: null,
  source: { kind: 'manual' },
  department: 'Медицинский',
};

function setup(similar: unknown[] = []) {
  return fakeApi(
    {
      'GET /tasks/directory': { people: [person], projects: [], columns: [] },
      'GET /tasks/similar': similar,
      'POST /tasks/items': created,
    },
    ['tasks.view', 'tasks.create', 'tasks.assign'],
  );
}

it('sends the chosen reminder with the new task', async () => {
  const calls = setup();
  await renderScreen(<NewTaskScreen />);
  await fireEvent.changeText(screen.getByLabelText('Название'), 'Подготовить смету на сборы');
  await fireEvent.press(await screen.findByText('Н. Бакиров'));
  await fireEvent.press(screen.getByText('за 3 дня'));
  await fireEvent.press(screen.getByText('Создать задачу'));
  await waitFor(() => {
    const body = calls.find((c) => c.method === 'POST' && c.path === '/tasks/items')?.body as
      | Record<string, unknown>
      | undefined;
    expect(body?.reminderDays).toBe(3);
    expect(body?.confirmDuplicate).toBe(false);
  });
});
