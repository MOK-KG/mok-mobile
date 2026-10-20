import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { ApiError, api } from '@/shared/api/client';
import { storage } from '@/shared/lib/storage';
import { mockApi, mockOutcome } from './mock';
import type { Session, SignInError, SignInResult } from './types';

const TOKEN_KEY = 'nok.sessionToken';

const authHeaders = (): Record<string, string> => {
  const token = storage.get(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Вход через Google ведёт бэкенд (OAuth). Приложение открывает /auth/google/start в системном
 * браузере, бэкенд проверяет домен и возвращает в приложение по nokkr://auth?token=...
 * или nokkr://auth?error=forbidden_domain&email=... Контракт уточнится с OpenAPI.
 */
export const authApi = {
  async getSession(): Promise<Session | null> {
    if (mockOutcome()) return mockApi.getSession();
    if (!storage.get(TOKEN_KEY)) return null;
    try {
      return await api.get<Session>('/auth/me', { headers: authHeaders() });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        storage.remove(TOKEN_KEY);
        return null;
      }
      throw error;
    }
  },

  async startGoogleSignIn(): Promise<SignInResult> {
    const outcome = mockOutcome();
    if (outcome) return mockApi.startGoogleSignIn(outcome);

    const returnTo = Linking.createURL('auth');
    const result = await WebBrowser.openAuthSessionAsync(
      api.url('/auth/google/start', { returnTo }),
      returnTo,
    );
    if (result.type !== 'success') return { ok: false, cancelled: true };

    const { queryParams } = Linking.parse(result.url);
    const token = queryParams?.token;
    if (typeof token === 'string') {
      storage.set(TOKEN_KEY, token);
      return { ok: true };
    }
    return { ok: false, error: readSignInError(queryParams ?? {}) };
  },

  async signOut(): Promise<void> {
    if (mockOutcome()) return mockApi.signOut();
    try {
      await api.post<void>('/auth/logout', undefined, { headers: authHeaders() });
    } finally {
      storage.remove(TOKEN_KEY);
    }
  },
};

function readSignInError(params: Record<string, unknown>): SignInError {
  const { error, email } = params;
  if (error === 'forbidden_domain' && typeof email === 'string') {
    return { code: 'forbidden_domain', email };
  }
  return { code: 'unknown' };
}
