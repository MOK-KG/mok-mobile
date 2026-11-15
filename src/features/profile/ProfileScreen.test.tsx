import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Alert, type AlertButton } from 'react-native';
import { fakeApi } from '@/test/fakeApi';
import { renderScreen } from '@/test/render';
import { ProfileScreen } from './ProfileScreen';

const allOn = {
  assigned: true,
  escalation: true,
  overdue: true,
  mailQueue: true,
  mention: true,
  reminder: true,
  done: true,
  pendingUser: true,
};

const session = (id: string, device: string, platform: string, current: boolean) => ({
  id,
  device,
  platform,
  ip: null,
  createdAt: '2026-11-14T09:00:00+06:00',
  lastSeenAt: '2026-11-15T14:40:00+06:00',
  current,
});

let alert: jest.SpyInstance;

beforeEach(() => {
  alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

afterEach(() => alert.mockRestore());

function setup(extra: Record<string, unknown> = {}, permissions = ['tasks.view']) {
  return fakeApi(
    {
      'GET /notifications/settings': allOn,
      'GET /auth/sessions': {
        sessions: [
          session('a', 'НОК КР · iPhone', 'ios', true),
          session('b', 'Chrome · macOS', 'web', false),
        ],
      },
      'DELETE /auth/sessions/b': null,
      ...extra,
    },
    permissions as never,
  );
}

const alertButton = (label: string) =>
  ((alert.mock.calls.at(-1)?.[2] ?? []) as AlertButton[]).find((b) => b.text === label);

it('lists own devices and ends another session after confirmation', async () => {
  const calls = setup();
  await renderScreen(<ProfileScreen />);
  expect(await screen.findByText('Chrome · macOS')).toBeTruthy();
  expect(screen.getByText(/это устройство/)).toBeTruthy();
  expect(screen.queryByLabelText('Завершить: НОК КР · iPhone')).toBeNull();

  await fireEvent.press(screen.getByLabelText('Завершить: Chrome · macOS'));
  expect(alert.mock.calls[0][1]).toContain('«Chrome · macOS»');
  expect(calls.some((c) => c.method === 'DELETE')).toBe(false);
  alertButton('Завершить')?.onPress?.();
  await waitFor(() =>
    expect(calls.some((c) => c.method === 'DELETE' && c.path === '/auth/sessions/b')).toBe(true),
  );
});

it('hides the devices block when the server has no session list', async () => {
  setup({ 'GET /auth/sessions': undefined });
  await renderScreen(<ProfileScreen />);
  expect(await screen.findByText('Назначенные мне задачи')).toBeTruthy();
  expect(screen.queryByText('Устройства и сессии')).toBeNull();
});

it('shows the pending user toggle only to those who assign roles', async () => {
  setup();
  await renderScreen(<ProfileScreen />);
  expect(await screen.findByText('Назначенные мне задачи')).toBeTruthy();
  expect(screen.queryByText('Новые сотрудники без роли')).toBeNull();
});

it('locks assignment and escalation toggles', async () => {
  setup({}, ['tasks.view', 'roles.assign']);
  await renderScreen(<ProfileScreen />);
  expect(await screen.findByText('Новые сотрудники без роли')).toBeTruthy();
  const disabled = (label: string) => screen.getByLabelText(label).props.disabled;
  expect(disabled('Назначенные мне задачи')).toBe(true);
  expect(disabled('Эскалации')).toBe(true);
  expect(disabled('Завершённые задачи')).toBe(false);
});
