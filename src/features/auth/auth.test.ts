import { sessionToken } from '@/shared/api/token';
import { authApi } from './api';

jest.mock('@/shared/lib/storage', () => {
  const values = new Map<string, string>();
  return {
    storage: {
      get: (key: string) => values.get(key) ?? null,
      set: (key: string, value: string) => values.set(key, value),
      remove: (key: string) => values.delete(key),
    },
  };
});

jest.mock('expo-web-browser', () => ({ openAuthSessionAsync: jest.fn() }));

jest.mock('expo-linking', () => ({
  createURL: (path: string) => `nokkr://${path}`,
  parse: (url: string) => {
    const query = new URL(url).searchParams;
    return { queryParams: Object.fromEntries(query.entries()) };
  },
}));

const WebBrowser = jest.requireMock('expo-web-browser');

const fetchMock = jest.fn();
globalThis.fetch = fetchMock as unknown as typeof fetch;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const returnsTo = (url: string) =>
  WebBrowser.openAuthSessionAsync.mockResolvedValue({ type: 'success', url });

beforeEach(() => {
  fetchMock.mockReset();
  WebBrowser.openAuthSessionAsync.mockReset();
  sessionToken.clear();
});

describe('startGoogleSignIn', () => {
  it('opens Google sign-in with the app return address', async () => {
    WebBrowser.openAuthSessionAsync.mockResolvedValue({ type: 'cancel' });
    await authApi.startGoogleSignIn();
    const [url, returnTo] = WebBrowser.openAuthSessionAsync.mock.calls[0];
    expect(url).toContain('/auth/google/start?returnTo=nokkr%3A%2F%2Fauth');
    expect(returnTo).toBe('nokkr://auth');
  });

  it('exchanges the one-time code for a session token', async () => {
    returnsTo('nokkr://auth?code=one-time');
    fetchMock.mockResolvedValue(json(200, { token: 'session-key' }));

    expect(await authApi.startGoogleSignIn()).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/auth\/mobile\/token$/);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ code: 'one-time' });
    expect(sessionToken.get()).toBe('session-key');
  });

  it('reports a cancelled sign-in', async () => {
    WebBrowser.openAuthSessionAsync.mockResolvedValue({ type: 'cancel' });
    expect(await authApi.startGoogleSignIn()).toEqual({ ok: false, cancelled: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reports a personal address', async () => {
    returnsTo('nokkr://auth?error=forbidden_domain&email=a.duysheyev%40gmail.com');
    expect(await authApi.startGoogleSignIn()).toEqual({
      ok: false,
      error: { code: 'forbidden_domain', email: 'a.duysheyev@gmail.com' },
    });
    expect(sessionToken.get()).toBeNull();
  });

  it('reports other errors as unknown', async () => {
    returnsTo('nokkr://auth?error=deactivated');
    expect(await authApi.startGoogleSignIn()).toEqual({ ok: false, error: { code: 'unknown' } });
  });

  it('does not keep a token when the code is rejected', async () => {
    returnsTo('nokkr://auth?code=stale');
    fetchMock.mockResolvedValue(json(400, { code: 'invalid_code' }));
    expect(await authApi.startGoogleSignIn()).toEqual({ ok: false, error: { code: 'unknown' } });
    expect(sessionToken.get()).toBeNull();
  });
});

describe('getSession', () => {
  it('skips the request without a token', async () => {
    expect(await authApi.getSession()).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns the session with a string user id', async () => {
    sessionToken.set('session-key');
    fetchMock.mockResolvedValue(
      json(200, { status: 'active', user: { id: 7, email: 'a.duysheyev@olympic.kg' } }),
    );
    const session = await authApi.getSession();
    expect(session?.user.id).toBe('7');
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer session-key');
  });

  it('forgets an expired token', async () => {
    sessionToken.set('expired');
    fetchMock.mockResolvedValue(json(401, { detail: 'Сессия не найдена или истекла.' }));
    expect(await authApi.getSession()).toBeNull();
    expect(sessionToken.get()).toBeNull();
  });

  it('keeps the token on a network error', async () => {
    sessionToken.set('session-key');
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));
    await expect(authApi.getSession()).rejects.toMatchObject({ status: 0 });
    expect(sessionToken.get()).toBe('session-key');
  });
});

describe('signOut', () => {
  it('ends the session on the server and forgets the token', async () => {
    sessionToken.set('session-key');
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await authApi.signOut();
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/auth\/logout$/);
    expect(sessionToken.get()).toBeNull();
  });

  it('forgets the token even if the server is unreachable', async () => {
    sessionToken.set('session-key');
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));
    await expect(authApi.signOut()).rejects.toBeDefined();
    expect(sessionToken.get()).toBeNull();
  });
});
