import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { sessionToken } from '@/shared/api/token';
import { fakeApi } from '@/test/fakeApi';
import { renderScreen } from '@/test/render';
import { LoginScreen } from './LoginScreen';

jest.mock('expo-web-browser', () => ({ openAuthSessionAsync: jest.fn() }));

jest.mock('expo-linking', () => ({
  createURL: (path: string) => `nokkr://${path}`,
  parse: (url: string) => ({
    queryParams: Object.fromEntries(new URL(url).searchParams.entries()),
  }),
}));

const WebBrowser = jest.requireMock('expo-web-browser');

beforeEach(() => {
  WebBrowser.openAuthSessionAsync.mockReset();
});

it('signs in with Google and keeps the session token', async () => {
  const calls = fakeApi({ 'POST /auth/mobile/token': { token: 'from-code' } });
  sessionToken.clear();
  WebBrowser.openAuthSessionAsync.mockResolvedValue({
    type: 'success',
    url: 'nokkr://auth?code=one-time',
  });

  await renderScreen(<LoginScreen />);
  await fireEvent.press(screen.getAllByText('Продолжить с Google')[0]);

  await waitFor(() => expect(sessionToken.get()).toBe('from-code'));
  expect(calls.find((c) => c.path === '/auth/mobile/token')?.body).toEqual({ code: 'one-time' });
});

it('explains that a personal address is not allowed', async () => {
  fakeApi({});
  sessionToken.clear();
  WebBrowser.openAuthSessionAsync.mockResolvedValue({
    type: 'success',
    url: 'nokkr://auth?error=forbidden_domain&email=a.duysheyev%40gmail.com',
  });

  await renderScreen(<LoginScreen />);
  await fireEvent.press(screen.getAllByText('Продолжить с Google')[0]);

  expect(await screen.findByText('Доступ запрещён')).toBeTruthy();
  expect(screen.getByText(/a\.duysheyev@gmail\.com/)).toBeTruthy();
  expect(sessionToken.get()).toBeNull();
});
