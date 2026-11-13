import { storage } from '@/shared/lib/storage';

/**
 * Токен сессии мобильного приложения. Бэкенд выдаёт его после входа через Google
 * (редирект на nokkr://auth?token=...), клиент передаёт его в каждом запросе.
 */
const TOKEN_KEY = 'nok.sessionToken';

export const sessionToken = {
  get: () => storage.get(TOKEN_KEY),
  set: (token: string) => storage.set(TOKEN_KEY, token),
  clear: () => storage.remove(TOKEN_KEY),
};
