import { createApiClient } from './request';
import { sessionToken } from './token';

export const api = createApiClient({
  baseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000',
  headers: (): Record<string, string> => {
    const token = sessionToken.get();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
});

export { ApiError } from './errors';
