import { fireEvent, screen, waitFor, within } from '@testing-library/react-native';
import { router } from 'expo-router';
import { fakeApi } from '@/test/fakeApi';
import { renderScreen } from '@/test/render';
import { ConversationScreen } from './ConversationScreen';

const now = new Date().toISOString();

const members = [
  {
    id: 7,
    email: 'a.duysheyev@olympic.kg',
    name: 'Айбек Дуйшеев',
    department: 'Аппарат',
    role: 'R3',
    active: true,
  },
  {
    id: 8,
    email: 'n.bakirov@olympic.kg',
    name: 'Нурлан Бакиров',
    department: 'Юридический отдел',
    role: 'R4',
    active: true,
  },
  {
    id: 9,
    email: 'd.toktosunova@olympic.kg',
    name: 'Дамира Токтосунова',
    department: 'Юридический отдел',
    role: 'R5',
    active: true,
  },
];

const message = {
  id: 100,
  chatId: 5,
  authorId: 8,
  at: now,
  kind: 'text',
  text: 'Договор с федерацией готов к проверке',
  threadId: null,
  task: null,
  system: null,
  file: null,
};

const chat = {
  id: 5,
  kind: 'channel',
  title: 'Юридический',
  fullTitle: 'Юридический отдел',
  memberIds: [7, 8, 9],
  peerId: null,
  readAt: now,
  muted: false,
  last: message,
  unread: 0,
};

function setup() {
  const sent: unknown[] = [];
  const calls = fakeApi(
    {
      'GET /chat/chats': [chat],
      'GET /chat/members': members,
      'GET /chat/chats/5/messages': [message],
      'POST /chat/chats/5/read': null,
      'GET /chat/unread': { total: 0 },
      'POST /chat/chats/5/messages': (body: unknown) => {
        sent.push(body);
        return { ...message, id: 101, authorId: 7, text: (body as { text: string }).text };
      },
    },
    ['chat.use', 'tasks.view'],
  );
  return { calls, sent };
}

const suggestions = async () => within(await screen.findByLabelText('Упомянуть участника'));

const type = async (text: string) => {
  const input = screen.getByPlaceholderText('Сообщение…');
  await fireEvent.changeText(input, text);
  await fireEvent(input, 'selectionChange', {
    nativeEvent: { selection: { start: text.length, end: text.length } },
  });
};

it('shows the messages of the chat', async () => {
  setup();
  await renderScreen(<ConversationScreen chatId="5" />);
  expect(await screen.findByText('Договор с федерацией готов к проверке')).toBeTruthy();
});

it('suggests chat members after @ and sends the mention', async () => {
  const { sent } = setup();
  await renderScreen(<ConversationScreen chatId="5" />);
  await screen.findByText('Договор с федерацией готов к проверке');

  await type('Посмотрите @бак');
  const list = await suggestions();
  expect(list.queryByRole('button', { name: 'Дамира Токтосунова' })).toBeNull();
  await fireEvent.press(list.getByRole('button', { name: 'Нурлан Бакиров' }));
  expect(screen.getByPlaceholderText('Сообщение…').props.value).toBe('Посмотрите @Н. Бакиров ');
  expect(screen.queryByLabelText('Упомянуть участника')).toBeNull();

  await fireEvent.press(screen.getByLabelText('Отправить'));
  await waitFor(() =>
    expect(sent).toEqual([expect.objectContaining({ text: 'Посмотрите @Н. Бакиров' })]),
  );
});

it('does not suggest myself', async () => {
  setup();
  await renderScreen(<ConversationScreen chatId="5" />);
  await screen.findByText('Договор с федерацией готов к проверке');
  await type('@');
  const list = await suggestions();
  expect(list.getByRole('button', { name: 'Нурлан Бакиров' })).toBeTruthy();
  expect(list.getByRole('button', { name: 'Дамира Токтосунова' })).toBeTruthy();
  expect(list.queryByRole('button', { name: 'Айбек Дуйшеев' })).toBeNull();
});

function withArticles(permissions: string[]) {
  return fakeApi(
    {
      'GET /chat/chats': [chat],
      'GET /chat/members': members,
      'GET /chat/chats/5/messages': [
        {
          ...message,
          id: 102,
          kind: 'article',
          text: '',
          article: { id: 'akkreditaciia', title: 'Порядок аккредитации' },
        },
        { ...message, id: 103, kind: 'article', text: '', article: { id: null, title: null } },
      ],
      'POST /chat/chats/5/read': null,
      'GET /chat/unread': { total: 0 },
    },
    permissions as never,
  );
}

it('shows article cards and hides closed articles', async () => {
  withArticles(['chat.use', 'knowledge.view']);
  await renderScreen(<ConversationScreen chatId="5" />);
  await fireEvent.press(await screen.findByLabelText('Открыть статью: Порядок аккредитации'));
  expect(router.push).toHaveBeenCalledWith('/knowledge/akkreditaciia');
  expect(screen.getByText('Статья из закрытого раздела')).toBeTruthy();
  expect(screen.getByLabelText('Прикрепить статью')).toBeTruthy();
});

it('offers attachments only with the rights to them', async () => {
  withArticles(['chat.use']);
  await renderScreen(<ConversationScreen chatId="5" />);
  await screen.findByText('Порядок аккредитации');
  expect(screen.queryByLabelText('Прикрепить статью')).toBeNull();
  expect(screen.queryByLabelText('Прикрепить задачу')).toBeNull();
});

it('shows a task card without its title to those who cannot see tasks', async () => {
  fakeApi(
    {
      'GET /chat/chats': [chat],
      'GET /chat/members': members,
      'GET /chat/chats/5/messages': [
        {
          ...message,
          id: 104,
          kind: 'task',
          text: '',
          task: null,
          taskHidden: true,
        },
      ],
      'POST /chat/chats/5/read': null,
      'GET /chat/unread': { total: 0 },
    },
    ['chat.use'],
  );
  await renderScreen(<ConversationScreen chatId="5" />);
  expect(await screen.findByText('Задача недоступна — нет доступа к задачам')).toBeTruthy();
});
