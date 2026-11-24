import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { Alert, type AlertButton } from 'react-native';
import { fakeApi } from '@/test/fakeApi';
import { renderScreen } from '@/test/render';
import { GroupInfoScreen } from './GroupInfoScreen';
import { NewGroupScreen } from './NewGroupScreen';

const member = (id: number, name: string, role: string) => ({
  id,
  email: `${id}@olympic.kg`,
  name,
  department: 'Аппарат',
  role,
  active: true,
});

const members = [
  member(7, 'Айбек Дуйшеев', 'R3'),
  member(8, 'Нурлан Бакиров', 'R5'),
  member(9, 'Дамира Токтосунова', 'R5'),
];

const group = {
  id: 12,
  kind: 'group',
  title: 'Подготовка к Играм',
  fullTitle: 'Подготовка к Играм',
  description: 'Сборы и аккредитация',
  createdById: '7',
  memberIds: [7, 8],
  peerId: null,
  readAt: new Date().toISOString(),
  muted: false,
  last: null,
  unread: 0,
};

let alert: jest.SpyInstance;
beforeEach(() => {
  alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});
afterEach(() => alert.mockRestore());

it('creates a group after the title and members are filled in', async () => {
  const calls = fakeApi(
    {
      'GET /chat/members': members,
      'GET /chat/chats': [],
      'POST /chat/chats/groups': { ...group, id: 15 },
    },
    ['chat.use'],
  );
  await renderScreen(<NewGroupScreen />);
  await fireEvent.press(await screen.findByText('Создать группу'));
  expect(screen.getByText('Название — от 2 до 80 символов')).toBeTruthy();
  expect(screen.getByText('Выберите хотя бы одного участника')).toBeTruthy();
  expect(calls.some((c) => c.method === 'POST')).toBe(false);

  await fireEvent.changeText(screen.getByLabelText('Название'), 'Подготовка к Играм');
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Нурлан Бакиров' }));
  await fireEvent.press(screen.getByText('Создать группу'));
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/chat/15'));
  expect(calls.find((c) => c.path === '/chat/chats/groups')?.body).toEqual({
    title: 'Подготовка к Играм',
    description: '',
    memberIds: ['8'],
  });
});

it('lets the creator see members and leave after confirmation', async () => {
  const calls = fakeApi(
    {
      'GET /chat/members': members,
      'GET /chat/chats': [group],
      'DELETE /chat/chats/12/members/7': null,
    },
    ['chat.use'],
  );
  await renderScreen(<GroupInfoScreen chatId="12" />);
  expect(await screen.findByText('Нурлан Бакиров')).toBeTruthy();
  expect(screen.getByLabelText('Убрать из группы: Нурлан Бакиров')).toBeTruthy();
  expect(screen.queryByText('Дамира Токтосунова')).toBeNull();

  await fireEvent.press(screen.getByText('Покинуть группу'));
  expect(alert.mock.calls[0][1]).toContain('«Подготовка к Играм»');
  expect(calls.some((c) => c.method === 'DELETE')).toBe(false);
  const buttons = (alert.mock.calls[0][2] ?? []) as AlertButton[];
  buttons.find((b) => b.style === 'destructive')?.onPress?.();
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/chat'));
  expect(calls.some((c) => c.method === 'DELETE' && c.path === '/chat/chats/12/members/7')).toBe(
    true,
  );
});
