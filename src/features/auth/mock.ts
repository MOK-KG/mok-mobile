import type { Session, SignInResult } from './types';

/**
 * Заглушка авторизации, пока нет бэкенда.
 *
 * Включается переменной EXPO_PUBLIC_AUTH_MOCK (active | pending | denied).
 * Данные вымышленные (см. CLAUDE.md, раздел «Данные»).
 */
export type MockOutcome = 'active' | 'pending' | 'denied';

const OUTCOMES: MockOutcome[] = ['active', 'pending', 'denied'];

export const mockUser = { email: 'a.duysheyev@olympic.kg', name: 'Айбек Дуйшеев' };
export const mockForeignEmail = 'a.duysheyev@gmail.com';

export function mockOutcome(): MockOutcome | null {
  const value = process.env.EXPO_PUBLIC_AUTH_MOCK;
  return OUTCOMES.includes(value as MockOutcome) ? (value as MockOutcome) : null;
}

let mockSession: Session | null = null;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockApi = {
  async getSession(): Promise<Session | null> {
    await delay(150);
    return mockSession;
  },

  /** Имитирует переход в Google и возврат обратно */
  async startGoogleSignIn(outcome: MockOutcome): Promise<SignInResult> {
    await delay(1200);
    if (outcome === 'denied') {
      return { ok: false, error: { code: 'forbidden_domain', email: mockForeignEmail } };
    }
    mockSession = { status: outcome, user: mockUser };
    return { ok: true };
  },

  async signOut(): Promise<void> {
    mockSession = null;
  },
};
