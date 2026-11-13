import { storage } from '@/shared/lib/storage';

const TOKEN_KEY = 'nok.sessionToken';

export const sessionToken = {
  get: () => storage.get(TOKEN_KEY),
  set: (token: string) => storage.set(TOKEN_KEY, token),
  clear: () => storage.remove(TOKEN_KEY),
};
