import { fireEvent, screen } from '@testing-library/react-native';
import { fakeApi, me } from '@/test/fakeApi';
import { renderScreen } from '@/test/render';
import { PendingScreen } from './PendingScreen';

it('shows a loader while the status is being checked', async () => {
  let release: () => void = () => {};
  const pending = { status: 'pending', user: { ...me, roles: [], permissions: [] } };
  let calls = 0;
  fakeApi({
    'GET /auth/me': () => {
      calls += 1;
      return pending;
    },
  });
  await renderScreen(<PendingScreen />);
  await screen.findByText('Обновить статус');

  const fetchMock = globalThis.fetch as jest.Mock;
  const original = fetchMock.getMockImplementation();
  fetchMock.mockImplementationOnce(
    (...args) =>
      new Promise((resolve) => {
        release = () => resolve(original?.(...args));
      }),
  );

  await fireEvent.press(screen.getByText('Обновить статус'));
  expect(await screen.findByText('Проверяем…')).toBeTruthy();

  release();
  expect(await screen.findByText('Обновить статус')).toBeTruthy();
  expect(calls).toBeGreaterThanOrEqual(1);
});
