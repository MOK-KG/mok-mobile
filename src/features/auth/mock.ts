import { mockRoleMatrix, type RoleCode, roleCodes } from '@/shared/config/permissions';
import type { Session, SignInResult } from './types';

/**
 * Заглушка авторизации, пока нет бэкенда.
 *
 * Исход входа: EXPO_PUBLIC_AUTH_MOCK (active | pending | denied).
 * Роль: EXPO_PUBLIC_AUTH_MOCK_ROLE (R1–R9, по умолчанию R1).
 * Смена роли «на лету»: globalThis.__nokMock.setRole('R6') из отладчика.
 * Данные вымышленные (см. CLAUDE.md, раздел «Данные»).
 */
export type MockOutcome = 'active' | 'pending' | 'denied';

const OUTCOMES: MockOutcome[] = ['active', 'pending', 'denied'];

export const mockForeignEmail = 'a.duysheyev@gmail.com';

const isRole = (value: unknown): value is RoleCode => roleCodes.includes(value as RoleCode);

export function mockOutcome(): MockOutcome | null {
  const value = process.env.EXPO_PUBLIC_AUTH_MOCK;
  return OUTCOMES.includes(value as MockOutcome) ? (value as MockOutcome) : null;
}

function mockRole(): RoleCode {
  const value = process.env.EXPO_PUBLIC_AUTH_MOCK_ROLE;
  return isRole(value) ? value : 'R1';
}

export function mockSessionFor(status: Session['status'], role: RoleCode): Session {
  return {
    status,
    user: {
      email: 'a.duysheyev@olympic.kg',
      name: 'Айбек Дуйшеев',
      position: 'Ген. секретарь',
      department: 'Административный департамент',
      roles: status === 'active' ? [role] : [],
      permissions: status === 'active' ? mockRoleMatrix[role] : [],
    },
  };
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
    mockSession = mockSessionFor(outcome, mockRole());
    return { ok: true };
  },

  async signOut(): Promise<void> {
    mockSession = null;
  },

  /** Сменить роль текущему пользователю — как будто администратор поменял её на бэкенде */
  setRole(role: RoleCode) {
    if (!isRole(role)) throw new Error(`Нет роли ${role}. Есть: ${roleCodes.join(', ')}`);
    mockSession = mockSessionFor('active', role);
  },
};

if (__DEV__) {
  (globalThis as unknown as { __nokMock: typeof mockApi }).__nokMock = mockApi;
}
