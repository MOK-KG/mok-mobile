import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { Alert, type AlertButton } from 'react-native';
import { fakeApi } from '@/test/fakeApi';
import { renderScreen } from '@/test/render';
import { RoleListScreen, RolePermissionsScreen } from './RoleMatrixScreen';

const roles = [
  { code: 'R5', name: 'Сотрудник департамента', permissions: ['tasks.view', 'chat.use'] },
  { code: 'R9', name: 'Наблюдатель', permissions: ['tasks.view'] },
];

let alert: jest.SpyInstance;

beforeEach(() => {
  alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

afterEach(() => alert.mockRestore());

const alertButton = (label: string) =>
  ((alert.mock.calls.at(-1)?.[2] ?? []) as AlertButton[]).find((b) => b.text === label);

it('lists roles with their permission counts and opens one', async () => {
  fakeApi({ 'GET /staff/roles': { roles } }, ['staff.view']);
  await renderScreen(<RoleListScreen />);
  expect(await screen.findByText('Сотрудник департамента')).toBeTruthy();
  expect(screen.getByText('2 права')).toBeTruthy();
  expect(screen.getByText('1 право')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('R9 Наблюдатель'));
  expect(router.push).toHaveBeenCalledWith('/access/roles/R9');
});

it('shows permissions read-only without roles.assign', async () => {
  fakeApi({ 'GET /staff/roles': { roles } }, ['staff.view']);
  await renderScreen(<RolePermissionsScreen code="R9" />);
  expect(await screen.findByLabelText('Пользоваться чатом: —')).toBeTruthy();
  expect(screen.queryByRole('switch')).toBeNull();
});

it('grants a permission after confirmation', async () => {
  const calls = fakeApi(
    {
      'GET /staff/roles': { roles },
      'PATCH /staff/roles/R9': (body: unknown) => ({ ...roles[1], ...(body as object) }),
    },
    ['staff.view', 'roles.assign'],
  );
  await renderScreen(<RolePermissionsScreen code="R9" />);
  await fireEvent(await screen.findByLabelText('Пользоваться чатом'), 'valueChange', true);
  expect(screen.getByText('1 изменение')).toBeTruthy();
  await fireEvent.press(screen.getByText('Сохранить'));
  expect(alert.mock.calls[0][1]).toContain('R9: выдать «Пользоваться чатом»');
  expect(calls.some((c) => c.method === 'PATCH')).toBe(false);
  alertButton('Сохранить')?.onPress?.();
  await waitFor(() =>
    expect(calls.find((c) => c.method === 'PATCH')?.body).toEqual({
      permissions: ['tasks.view', 'chat.use'],
    }),
  );
});
