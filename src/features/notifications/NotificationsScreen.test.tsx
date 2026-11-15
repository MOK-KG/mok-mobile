import { fireEvent, screen, waitFor } from '@testing-library/react-native';
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
