import { screen } from '@testing-library/react-native';
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
