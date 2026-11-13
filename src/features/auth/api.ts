import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { ApiError, api } from '@/shared/api/client';
import { sessionToken } from '@/shared/api/token';
import { mockApi, mockOutcome } from './mock';
import type { Session, SignInError, SignInResult } from './types';

/**
 * Вход через Google ведёт бэкенд (OAuth):
 * 1. Приложение открывает /auth/google/start?returnTo=nokkr://auth в системном браузере.
 * 2. Бэкенд проверяет домен и возвращает в приложение nokkr://auth?code=... — одноразовый
 *    код на 60 секунд, а не сам токен: схему nokkr:// может перехватить другое приложение.
 *    Ошибка — nokkr://auth?error=forbidden_domain&email=... или ?error=<код>.
 * 3. Приложение обменивает код на токен сессии: POST /auth/mobile/token { code } → { token }.
 * Токен — сессия Django, дальше он уходит заголовком Authorization (shared/api/client.ts).
 */
export const authApi = {
  async getSession(): Promise<Session | null> {
    if (mockOutcome()) return mockApi.getSession();
    if (!sessionToken.get()) return null;
    try {
      const session = await api.get<
        Omit<Session, 'user'> & {
          user: Omit<Session['user'], 'id'> & { id: number | string };
        }
      >('/auth/me');
      // ID на бэкенде — число; в приложении люди сравниваются по строке (Person.id)
      return { ...session, user: { ...session.user, id: String(session.user.id) } };
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        sessionToken.clear();
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
    const code = queryParams?.code;
    if (typeof code !== 'string') return { ok: false, error: readSignInError(queryParams ?? {}) };
    try {
      const { token } = await api.post<{ token: string }>('/auth/mobile/token', { code });
      sessionToken.set(token);
      return { ok: true };
    } catch {
      // Код просрочен или уже использован — войти заново
      return { ok: false, error: { code: 'unknown' } };
    }
  },

  async signOut(): Promise<void> {
    if (mockOutcome()) return mockApi.signOut();
    try {
      await api.post<void>('/auth/logout');
    } finally {
      sessionToken.clear();
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
