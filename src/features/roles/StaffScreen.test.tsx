import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Alert, type AlertButton } from 'react-native';
import { fakeApi } from '@/test/fakeApi';
import { renderScreen } from '@/test/render';
import { StaffScreen } from './StaffScreen';

const plan = {
  tasks: 1,
  escalated: 0,
  reassignTo: { id: '8', short: 'Б. Осмонов', isDirector: true },
};

const member = (id: string, personId: string, name: string, role: string | null) => ({
  id,
  personId,
  name,
  email: `${id}@olympic.kg`,
  role,
  department: 'Медицинский',
  position: 'Специалист',
  status: 'active',
  invitedAt: null,
  invitedBy: null,
  firstLoginAt: null,
  sessions: 1,
  deactivatedAt: null,
  deactivatedBy: null,
  absentNow: false,
  deputy: null,
  plan,
});

const members = [
  member('s-nb', '9', 'Нурлан Бакиров', 'R5'),
  member('s-ad', '7', 'Айбек Дуйшеев', 'R3'),
  {
    ...member('s-dt', '11', 'Дамира Токтосунова', null),
    status: 'pending',
    firstLoginAt: '2026-11-14T10:05:00+06:00',
    sessions: 0,
  },
];

const sessions = [
  {
    id: 'w1',
    device: 'Chrome · macOS',
    platform: 'web',
    ip: null,
    createdAt: '2026-11-14T09:00:00+06:00',
    lastSeenAt: '2026-11-15T14:40:00+06:00',
    current: false,
  },
  {
    id: 'i1',
    device: 'НОК КР · iPhone',
    platform: 'ios',
    ip: null,
    createdAt: '2026-11-13T09:00:00+06:00',
    lastSeenAt: '2026-11-15T12:10:00+06:00',
    current: false,
  },
];

let alert: jest.SpyInstance;

function setup(extra: Record<string, unknown> = {}) {
  return fakeApi(
    {
      'GET /staff/members': { members },
      'POST /staff/members/s-dt/role': (body: unknown) => ({
        ...members[2],
        status: 'active',
        role: (body as { role: string }).role,
      }),
      ...extra,
      'POST /staff/members/s-nb/role': (body: unknown) => ({
        ...members[0],
        role: (body as { role: string }).role,
      }),
      'POST /staff/members/s-nb/deactivate': { reassigned: 1 },
    },
    ['staff.view', 'roles.assign', 'staff.deactivate'],
  );
}

const alertButton = (label: string) =>
  ((alert.mock.calls.at(-1)?.[2] ?? []) as AlertButton[]).find((b) => b.text === label);

beforeEach(() => {
  alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

afterEach(() => alert.mockRestore());

it('asks before changing a role and sends it on confirm', async () => {
  const calls = setup();
  await renderScreen(<StaffScreen staffId="s-nb" />);
  await fireEvent.press(await screen.findByText('R4 · Директор департамента'));

  expect(alert).toHaveBeenCalledTimes(1);
  const [title, message] = alert.mock.calls[0];
  expect(title).toBe('Сменить роль?');
  expect(message).toContain('Н. Бакиров: R5 Сотрудник департамента → R4 Директор департамента');
  expect(message).not.toContain('Это ваша роль');
  expect(calls.some((c) => c.path.endsWith('/role'))).toBe(false);

  alertButton('Сменить роль')?.onPress?.();
  await waitFor(() =>
    expect(calls.find((c) => c.path === '/staff/members/s-nb/role')?.body).toEqual({ role: 'R4' }),
  );
});

it('does nothing on cancel', async () => {
  const calls = setup();
  await renderScreen(<StaffScreen staffId="s-nb" />);
  await fireEvent.press(await screen.findByText('R9 · Наблюдатель'));
  expect(alertButton('Отмена')?.style).toBe('cancel');
  expect(calls.some((c) => c.path.endsWith('/role'))).toBe(false);
});

it('warns when changing your own role', async () => {
  setup();
  await renderScreen(<StaffScreen staffId="s-ad" />);
  await fireEvent.press(await screen.findByText('R9 · Наблюдатель'));
  expect(alert.mock.calls[0][1]).toContain('Это ваша роль');
});

it('lets you cancel a dismissal', async () => {
  const calls = setup();
  await renderScreen(<StaffScreen staffId="s-nb" />);
  await fireEvent.press(await screen.findByText('Деактивировать'));
  expect(screen.getByText('Да, деактивировать Н. Бакиров')).toBeTruthy();

  await fireEvent.press(screen.getByText('Отмена'));
  expect(screen.getByText('Деактивировать')).toBeTruthy();
  expect(calls.some((c) => c.path.endsWith('/deactivate'))).toBe(false);
});

it('dismisses after the second press', async () => {
  const calls = setup();
  await renderScreen(<StaffScreen staffId="s-nb" />);
  await fireEvent.press(await screen.findByText('Деактивировать'));
  await fireEvent.press(screen.getByText('Да, деактивировать Н. Бакиров'));
  await waitFor(() =>
    expect(
      calls.some((c) => c.method === 'POST' && c.path === '/staff/members/s-nb/deactivate'),
    ).toBe(true),
  );
});

it('assigns a role to a user waiting for one', async () => {
  const calls = setup();
  await renderScreen(<StaffScreen staffId="s-dt" />);
  expect(await screen.findByText('Роль не назначена')).toBeTruthy();
  expect(screen.getByText(/роль ещё не назначена/)).toBeTruthy();

  await fireEvent.press(screen.getByText('R5 · Сотрудник департамента'));
  const [title, message] = alert.mock.calls[0];
  expect(title).toBe('Назначить роль?');
  expect(message).toContain('R5 Сотрудник департамента');
  expect(alertButton('Сменить роль')).toBeUndefined();

  alertButton('Назначить роль')?.onPress?.();
  await waitFor(() =>
    expect(calls.find((c) => c.path === '/staff/members/s-dt/role')?.body).toEqual({ role: 'R5' }),
  );
});

it('falls back to the session count when the server has no device list', async () => {
  setup();
  await renderScreen(<StaffScreen staffId="s-nb" />);
  expect(await screen.findByText(/1 устройство · Список устройств появится/)).toBeTruthy();
});

it('ends one session after confirmation', async () => {
  const calls = setup({
    'GET /staff/members/s-nb/sessions': { sessions },
    'DELETE /staff/members/s-nb/sessions/w1': null,
  });
  await renderScreen(<StaffScreen staffId="s-nb" />);
  await fireEvent.press(await screen.findByLabelText('Завершить: Chrome · macOS'));

  expect(alert.mock.calls[0][0]).toBe('Завершить сессию?');
  expect(alert.mock.calls[0][1]).toContain('«Chrome · macOS»');
  expect(calls.some((c) => c.method === 'DELETE')).toBe(false);

  alertButton('Завершить')?.onPress?.();
  await waitFor(() =>
    expect(
      calls.some((c) => c.method === 'DELETE' && c.path === '/staff/members/s-nb/sessions/w1'),
    ).toBe(true),
  );
});

it('ends all sessions after confirmation', async () => {
  const calls = setup({
    'GET /staff/members/s-nb/sessions': { sessions },
    'DELETE /staff/members/s-nb/sessions': null,
  });
  await renderScreen(<StaffScreen staffId="s-nb" />);
  await fireEvent.press(await screen.findByText('Завершить все'));
  expect(alert.mock.calls[0][0]).toBe('Завершить все сессии?');
  expect(alertButton('Отмена')?.style).toBe('cancel');

  alertButton('Завершить все')?.onPress?.();
  await waitFor(() =>
    expect(
      calls.some((c) => c.method === 'DELETE' && c.path === '/staff/members/s-nb/sessions'),
    ).toBe(true),
  );
});
