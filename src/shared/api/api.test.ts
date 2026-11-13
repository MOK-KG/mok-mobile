import { api } from './client';
import { openProtectedFile } from './download';
import { sessionToken } from './token';
import { toUpload } from './upload';

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

const mockDownload = { downloadAsync: jest.fn() };
const mockCreated: { name: string; deleted: boolean }[] = [];

jest.mock('expo-file-system', () => {
  class Directory {
    create = jest.fn();
  }
  class File {
    uri: string;
    exists: boolean;
    record: { name: string; deleted: boolean };
    static createDownloadTask = jest.fn(() => mockDownload);
    constructor(_folder: unknown, name: string) {
      this.uri = `file:///cache/downloads/${name}`;
      this.exists = name === 'old.pdf';
      this.record = { name, deleted: false };
      mockCreated.push(this.record);
    }
    delete() {
      this.record.deleted = true;
    }
  }
  return { Directory, File, Paths: { cache: 'cache' } };
});

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(async () => {}),
}));

const { File } = jest.requireMock('expo-file-system');
const Sharing = jest.requireMock('expo-sharing');

const fetchMock = jest.fn();
globalThis.fetch = fetchMock as unknown as typeof fetch;

const ok = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

const sentHeaders = () => fetchMock.mock.calls[0][1].headers as Record<string, string>;

beforeEach(() => {
  fetchMock.mockReset();
  sessionToken.clear();
  mockCreated.length = 0;
  jest.clearAllMocks();
});

describe('api client', () => {
  it('sends the session token as Authorization', async () => {
    sessionToken.set('abc');
    fetchMock.mockResolvedValue(ok({ ok: true }));
    await api.get('/auth/me');
    expect(sentHeaders().Authorization).toBe('Bearer abc');
  });

  it('sends no Authorization without a token', async () => {
    fetchMock.mockResolvedValue(ok({ ok: true }));
    await api.get('/auth/me');
    expect(sentHeaders().Authorization).toBeUndefined();
  });

  it('picks up a token set after the client was created', async () => {
    fetchMock.mockImplementation(async () => ok({}));
    await api.get('/a');
    sessionToken.set('later');
    await api.get('/b');
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe('Bearer later');
  });
});

describe('toUpload', () => {
  it('maps a picked file to the React Native FormData shape', () => {
    expect(toUpload({ uri: 'file:///a.pdf', name: 'a.pdf', mimeType: 'application/pdf' })).toEqual({
      uri: 'file:///a.pdf',
      name: 'a.pdf',
      type: 'application/pdf',
    });
  });

  it('falls back to a generic type', () => {
    expect(toUpload({ uri: 'file:///x', name: 'x', mimeType: null })).toMatchObject({
      type: 'application/octet-stream',
    });
  });
});

describe('openProtectedFile', () => {
  it('downloads with the token and opens the share sheet', async () => {
    sessionToken.set('abc');
    mockDownload.downloadAsync.mockResolvedValue({ uri: 'file:///cache/downloads/report.pdf' });
    await openProtectedFile('https://api.test/file/1', 'report.pdf');
    expect(File.createDownloadTask).toHaveBeenCalledWith(
      'https://api.test/file/1',
      expect.anything(),
      { headers: { Authorization: 'Bearer abc' } },
    );
    expect(Sharing.shareAsync).toHaveBeenCalledWith('file:///cache/downloads/report.pdf');
  });

  it('strips path separators from the server file name', async () => {
    mockDownload.downloadAsync.mockResolvedValue({ uri: 'file:///x' });
    await openProtectedFile('https://api.test/f', '../../etc/passwd');
    expect(mockCreated[0].name).toBe('.._.._etc_passwd');
  });

  it('replaces a previously downloaded file', async () => {
    mockDownload.downloadAsync.mockResolvedValue({ uri: 'file:///x' });
    await openProtectedFile('https://api.test/f', 'old.pdf');
    expect(mockCreated[0].deleted).toBe(true);
  });

  it('does not share when the download did not finish', async () => {
    mockDownload.downloadAsync.mockResolvedValue(null);
    await openProtectedFile('https://api.test/f', 'a.pdf');
    expect(Sharing.shareAsync).not.toHaveBeenCalled();
  });
});
