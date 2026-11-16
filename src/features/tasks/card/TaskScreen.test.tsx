import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { Alert, type AlertButton } from 'react-native';
import { fakeApi } from '@/test/fakeApi';
import { renderScreen } from '@/test/render';
import { TaskScreen } from './TaskScreen';

const person = {
  id: 9,
  email: 'nb@olympic.kg',
  name: 'Нурлан Бакиров',
  position: 'Специалист',
  department: 'Медицинский',
};

const letter = (id: string, subject: string, body: string, followUp: boolean) => ({
  id,
  sender: 'МОК · Лозанна',
  address: 'compliance@olympic.org',
  subject,
  body,
  receivedAt: '2026-11-14T11:30:00+06:00',
  followUp,
  attachments: followUp ? 2 : 0,
});

const task = {
  id: 't-1',
  code: 'ЗД-2026-0001',
  title: 'Обновить антидопинговый отчёт',
  status: 'in_progress',
  columnId: 'c-2',
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
  fromEmail: true,
  reschedules: 0,
  escalationHours: null,
  description: 'Please provide the report.',
  knowledgeLink: { id: 'antidoping', title: 'Антидопинговые правила' },
  subtaskItems: [],
  commentItems: [],
  attachmentItems: [],
  history: [
    {
      id: 'h-2',
      kind: 'letter',
      text: 'МОК · Лозанна|Re: Anti-doping report',
      at: '2026-11-14T11:30:00+06:00',
    },
    { id: 'h-1', kind: 'created', text: 'email', at: '2026-11-10T09:00:00+06:00' },
  ],
  rescheduleLog: [],
  letters: [
    letter('l-1', 'Anti-doping report', 'Please provide the report.', false),
    letter('l-2', 'Re: Anti-doping report', 'Any update?', true),
  ],
  reminderDays: null,
  escalatedAt: null,
  source: { kind: 'email', mailbox: 'info@olympic.kg', at: '2026-11-10T09:00:00+06:00' },
  department: 'Медицинский',
};

it('shows the correspondence with the latest reply expanded', async () => {
  fakeApi({ 'GET /tasks/items/t-1': task }, ['tasks.view']);
  await renderScreen(<TaskScreen taskId="t-1" />);
  expect(await screen.findByText('Переписка · 2 письма')).toBeTruthy();
  expect(screen.getByText('Any update?')).toBeTruthy();
  expect(screen.getByText(/2 вложения/)).toBeTruthy();
  expect(screen.getByText('Пришёл ответ: МОК · Лозанна — «Re: Anti-doping report»')).toBeTruthy();

  await fireEvent.press(screen.getByText('Anti-doping report'));
  expect(screen.queryByText('Any update?')).toBeNull();
});

it('opens the linked knowledge base article itself', async () => {
  fakeApi({ 'GET /tasks/items/t-1': task }, ['tasks.view']);
  await renderScreen(<TaskScreen taskId="t-1" />);
  await fireEvent.press(await screen.findByText(/Антидопинговые правила/));
  expect(router.push).toHaveBeenCalledWith('/knowledge/antidoping');
});

const other = { ...person, id: 7, email: 'ad@olympic.kg', name: 'Айбек Дуйшеев' };
const columns = [
  { id: 'c-1', name: 'Очередь', stage: 'queue', wipLimit: null },
  { id: 'c-2', name: 'В работе', stage: 'in_progress', wipLimit: null },
  { id: 'c-4', name: 'Готово', stage: 'done', wipLimit: null },
];

function manage(permissions: string[]) {
  return fakeApi(
    {
      'GET /tasks/items/t-1': task,
      'GET /tasks/directory': { people: [person, other], projects: [], columns },
      'POST /tasks/items/t-1/move': task,
      'PATCH /tasks/items/t-1': task,
      'POST /tasks/items/t-1/archive': { archived: true },
    },
    permissions as never,
  );
}

it('changes status and assignee right from the card', async () => {
  const calls = manage(['tasks.view', 'tasks.edit', 'tasks.assign']);
  await renderScreen(<TaskScreen taskId="t-1" />);
  await fireEvent.press(await screen.findByText('Готово'));
  await waitFor(() =>
    expect(calls.find((c) => c.path === '/tasks/items/t-1/move')?.body).toMatchObject({
      columnId: 'c-4',
    }),
  );
  await fireEvent.press(screen.getByText('А. Дуйшеев'));
  await waitFor(() =>
    expect(calls.find((c) => c.method === 'PATCH')?.body).toMatchObject({
      assigneeId: '7',
      due: null,
      title: 'Обновить антидопинговый отчёт',
    }),
  );
  expect(screen.queryByText('В архив')).toBeNull();
});

it('archives only after confirmation', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const calls = manage(['tasks.view', 'tasks.archive']);
  await renderScreen(<TaskScreen taskId="t-1" />);
  await fireEvent.press(await screen.findByText('В архив'));
  expect(alert.mock.calls[0][0]).toBe('Перенести задачу в архив?');
  expect(calls.some((c) => c.path.endsWith('/archive'))).toBe(false);
  const buttons = (alert.mock.calls[0][2] ?? []) as AlertButton[];
  buttons.find((b) => b.text === 'В архив')?.onPress?.();
  await waitFor(() =>
    expect(calls.find((c) => c.path === '/tasks/items/t-1/archive')?.body).toEqual({
      archived: true,
    }),
  );
  expect(screen.queryByText('Статус')).toBeNull();
  alert.mockRestore();
});

it('shows no management without the rights', async () => {
  manage(['tasks.view']);
  await renderScreen(<TaskScreen taskId="t-1" />);
  expect(await screen.findByText('Переписка · 2 письма')).toBeTruthy();
  expect(screen.queryByText('Управление')).toBeNull();
});
