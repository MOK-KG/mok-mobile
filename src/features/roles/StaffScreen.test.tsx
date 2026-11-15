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

const member = (id: string, personId: string, name: string, role: string) => ({
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
];

let alert: jest.SpyInstance;

function setup() {
  return fakeApi(
    {
      'GET /staff/members': { members },
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
