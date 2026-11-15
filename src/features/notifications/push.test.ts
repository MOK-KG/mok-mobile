import { registerForPush, routeFor, unregisterPush } from './push';

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

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  AndroidImportance: { HIGH: 4 },
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  useLastNotificationResponse: jest.fn(),
}));

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { eas: { projectId: 'project-1' } } } },
}));

const Notifications = jest.requireMock('expo-notifications');

const fetchMock = jest.fn();
globalThis.fetch = fetchMock as unknown as typeof fetch;

const noContent = () => new Response(null, { status: 204 });

beforeEach(() => {
  jest.clearAllMocks();
  fetchMock.mockReset();
  fetchMock.mockImplementation(async () => noContent());
});

describe('routeFor', () => {
  it('opens the task', () => {
    expect(routeFor({ target: 'task', taskId: 'abc' })).toBe('/tasks/abc');
  });

  it('opens the chat', () => {
    expect(routeFor({ target: 'chat', chatId: '12' })).toBe('/chat/12');
  });

  it('opens the mail queue', () => {
    expect(routeFor({ target: 'mailQueue' })).toBe('/tasks/queue');
  });

  it('opens the staff card', () => {
    expect(routeFor({ target: 'staff', staffId: '41' })).toBe('/access/41');
  });

  it('falls back to the notification list', () => {
    expect(routeFor({ target: null })).toBe('/notifications');
    expect(routeFor(undefined)).toBe('/notifications');
  });
});

describe('registerForPush', () => {
  it('sends the Expo token to the server', async () => {
    Notifications.getPermissionsAsync.mockResolvedValue({ granted: true });
    Notifications.getExpoPushTokenAsync.mockResolvedValue({ data: 'ExponentPushToken[x]' });

    expect(await registerForPush()).toBe('ExponentPushToken[x]');
    expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: 'project-1' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/notifications\/devices$/);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ token: 'ExponentPushToken[x]', platform: 'ios' });
  });

  it('asks for permission once', async () => {
    Notifications.getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true });
    Notifications.requestPermissionsAsync.mockResolvedValue({ granted: true });
    Notifications.getExpoPushTokenAsync.mockResolvedValue({ data: 'ExponentPushToken[x]' });

    await registerForPush();
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
  });

  it('does nothing when push is not allowed', async () => {
    Notifications.getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: false });

    expect(await registerForPush()).toBeNull();
    expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('unregisterPush', () => {
  it('removes the registered device from the server', async () => {
    Notifications.getPermissionsAsync.mockResolvedValue({ granted: true });
    Notifications.getExpoPushTokenAsync.mockResolvedValue({ data: 'ExponentPushToken[x]' });
    await registerForPush();
    fetchMock.mockClear();

    await unregisterPush();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/notifications\/devices$/);
    expect(init.method).toBe('DELETE');
    expect(JSON.parse(init.body)).toEqual({ token: 'ExponentPushToken[x]' });

    fetchMock.mockClear();
    await unregisterPush();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
