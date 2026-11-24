import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import { addDays, nextWorkingDay, todayInBishkek } from '@/shared/lib/workDays';
import { fakeApi, me } from '@/test/fakeApi';
import { renderScreen } from '@/test/render';
import { TasksScreen } from './TasksScreen';

const person = (id: number, name: string) => ({
  id,
  email: `${id}@olympic.kg`,
  name,
  position: 'Специалист',
  department: 'Аппарат',
});

const task = (id: string, title: string, assignee: ReturnType<typeof person>, due: string) => ({
  id,
  code: `ЗД-2026-${id}`,
  title,
  status: 'in_progress',
  columnId: 'c-2',
  position: 0,
  project: null,
  due,
  assignee,
  author: assignee,
  deputy: null,
  priority: 'normal',
  subtasks: 0,
  comments: 0,
  attachments: 0,
  fromEmail: false,
  reschedules: 0,
  escalationHours: null,
});

const mine = person(me.id, me.name);
const other = person(9, 'Нурлан Бакиров');
const today = todayInBishkek();
const overdue = addDays(today, -3);
const later = nextWorkingDay(addDays(today, 10));

function setup() {
  fakeApi(
    {
      'GET /tasks/board': {
        columns: [{ id: 'c-2', name: 'В работе', stage: 'in_progress', wipLimit: null }],
        tasks: [
          task('0001', 'Мой просроченный отчёт', mine, overdue),
          task('0002', 'Чужой просроченный договор', other, overdue),
          task('0003', 'Моя задача на потом', mine, later),
        ],
        counts: { mine: 2, department: 3, createdByMe: 0, completed: 0 },
      },
      'GET /tasks/items': [
        task('0001', 'Мой просроченный отчёт', mine, overdue),
        task('0002', 'Чужой просроченный договор', other, overdue),
        task('0003', 'Моя задача на потом', mine, later),
      ],
    },
    ['tasks.view'],
  );
}

afterEach(() => jest.mocked(useLocalSearchParams).mockReturnValue({}));

it('opens my overdue tasks when coming from the dashboard', async () => {
  jest.mocked(useLocalSearchParams).mockReturnValue({ quick: 'mine', due: 'overdue' });
  setup();
  await renderScreen(<TasksScreen />);
  expect(await screen.findByText('Мой просроченный отчёт')).toBeTruthy();
  expect(screen.queryByText('Чужой просроченный договор')).toBeNull();
  expect(screen.queryByText('Моя задача на потом')).toBeNull();
});

it('shows only my tasks under the «Мои» quick filter', async () => {
  jest.mocked(useLocalSearchParams).mockReturnValue({ quick: 'mine' });
  setup();
  await renderScreen(<TasksScreen />);
  expect(await screen.findByText('Моя задача на потом')).toBeTruthy();
  expect(screen.getByText('Мой просроченный отчёт')).toBeTruthy();
  expect(screen.queryByText('Чужой просроченный договор')).toBeNull();
});

it('switches to the board and moves a task to another column on long press', async () => {
  const board = {
    columns: [
      { id: 'c-1', name: 'Очередь', stage: 'queue', position: 0, wipLimit: null },
      { id: 'c-2', name: 'В работе', stage: 'in_progress', position: 1, wipLimit: 2 },
    ],
    tasks: [
      task('0001', 'Мой просроченный отчёт', mine, overdue),
      { ...task('0002', 'Задача в очереди', other, later), columnId: 'c-1', status: 'queue' },
    ],
    counts: { mine: 1, department: 2, createdByMe: 0, completed: 0 },
  };
  const calls = fakeApi(
    {
      'GET /tasks/board': board,
      'POST /tasks/items/0002/move': { ...board.tasks[1], columnId: 'c-2' },
    },
    ['tasks.view', 'tasks.edit'],
  );
  await renderScreen(<TasksScreen />);
  await screen.findByText('Задача в очереди');
  await fireEvent.press(screen.getByLabelText('Доска'));
  expect(await screen.findByText('1 / 2')).toBeTruthy();
  await fireEvent(screen.getByLabelText('Задача в очереди'), 'longPress');
  expect(screen.getByText('Переместить в…')).toBeTruthy();
  await fireEvent.press(screen.getAllByText('В работе').at(-1) as never);
  await waitFor(() =>
    expect(calls.find((c) => c.path === '/tasks/items/0002/move')?.body).toMatchObject({
      columnId: 'c-2',
    }),
  );
});
