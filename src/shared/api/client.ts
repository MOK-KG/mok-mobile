import { createApiClient } from './request';
import { sessionToken } from './token';

/**
 * HTTP-клиент мобильного приложения. Cookie здесь нет: сессия — токен из SecureStore,
 * он уходит заголовком Authorization в каждом запросе. Поэтому общие с web файлы
 * (features/{tasks,chat,...}/api.ts) работают без правок.
 */
export const api = createApiClient({
  baseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000',
  headers: (): Record<string, string> => {
    const token = sessionToken.get();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
});

export { ApiError } from './errors';
