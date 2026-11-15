import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { fakeApi } from '@/test/fakeApi';
import { renderScreen } from '@/test/render';
import { NotificationsScreen } from './NotificationsScreen';

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

const notifications = [
  {
    id: 1,
    kind: 'assigned',
    title: 'Новая задача · «Ответить на запрос МОК»',
    text: 'Поставил(а) Н. Бакиров',
    params: null,
    at: minutesAgo(5),
    read: false,
    target: { kind: 'task', taskId: 't-1', taskTitle: 'Ответить на запрос МОК' },
  },
  {
    id: 2,
    kind: 'mention',
    title: 'Д. Токтосунова упомянул(а) вас в чате',
    text: 'Юридический — посмотрите договор',
    params: null,
    at: minutesAgo(30),
    read: true,
    target: { kind: 'chat', chatId: '5' },
  },
  {
    id: 3,
    kind: 'mailQueue',
    title: 'Новые письма в очереди из почты',
    text: 'info@olympic.kg · ждут проверки перед созданием задач.',
    params: null,
    at: minutesAgo(60),
    read: false,
    target: { kind: 'mailQueue' },
  },
];

const routes = {
  'GET /notifications': notifications,
  'GET /tasks/mail/summary': { ready: 2, manual: 0 },
  'GET /chat/chats': [],
  'POST /notifications/read-all': null,
};

it('shows only notifications the user may open', async () => {
  fakeApi(routes, ['tasks.view', 'chat.use']);
  await renderScreen(<NotificationsScreen />);
  expect(await screen.findByText('Новая задача · «Ответить на запрос МОК»')).toBeTruthy();
  expect(screen.getByText('Д. Токтосунова упомянул(а) вас в чате')).toBeTruthy();
  expect(screen.queryByText('2 письма в очереди из почты')).toBeNull();
});

it('shows the mail queue to those who create tasks', async () => {
  fakeApi(routes, ['tasks.view', 'tasks.create', 'chat.use']);
  await renderScreen(<NotificationsScreen />);
  expect(await screen.findByText('2 письма в очереди из почты')).toBeTruthy();
});

it('marks everything as read on the server', async () => {
  const calls = fakeApi(routes, ['tasks.view', 'chat.use']);
  await renderScreen(<NotificationsScreen />);
  await screen.findByText('Новая задача · «Ответить на запрос МОК»');
  await fireEvent.press(screen.getByLabelText(/^Прочитать все/));
  await waitFor(() =>
    expect(calls.some((c) => c.method === 'POST' && c.path === '/notifications/read-all')).toBe(
      true,
    ),
  );
});

it('opens the staff card from a pending user notification', async () => {
  fakeApi(
    {
      ...routes,
      'GET /notifications': [
        {
          id: 9,
          kind: 'pendingUser',
          title: 'Дамира Токтосунова ждёт роль',
          text: 'dt@olympic.kg · вошёл(а) через Google, роль не назначена.',
          params: { name: 'Дамира Токтосунова', email: 'dt@olympic.kg', staffId: '41' },
          at: minutesAgo(2),
          read: false,
          target: { kind: 'staff', staffId: '41' },
        },
      ],
      'POST /notifications/9/read': null,
    },
    ['roles.assign'],
  );
  await renderScreen(<NotificationsScreen />);
  expect(await screen.findByText('Дамира Токтосунова ждёт роль')).toBeTruthy();
  await fireEvent.press(screen.getByText('Назначить роль'));
  expect(router.push).toHaveBeenCalledWith('/access/41');
});

it('hides pending user notifications without the right to assign roles', async () => {
  fakeApi(
    {
      ...routes,
      'GET /notifications': [
        {
          id: 9,
          kind: 'pendingUser',
          title: 'Дамира Токтосунова ждёт роль',
          text: '',
          params: null,
          at: minutesAgo(2),
          read: false,
          target: { kind: 'staff', staffId: '41' },
        },
        notifications[0],
      ],
    },
    ['tasks.view'],
  );
  await renderScreen(<NotificationsScreen />);
  expect(await screen.findByText('Новая задача · «Ответить на запрос МОК»')).toBeTruthy();
  expect(screen.queryByText('Дамира Токтосунова ждёт роль')).toBeNull();
});
