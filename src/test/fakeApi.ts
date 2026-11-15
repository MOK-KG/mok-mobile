import { sessionToken } from '@/shared/api/token';
import type { Permission } from '@/shared/config/permissions';

type Handler = (body: unknown, url: URL) => unknown;
export type Routes = Record<string, Handler | unknown>;
export type Call = { method: string; path: string; body: unknown };

export const me = {
  id: 7,
  email: 'a.duysheyev@olympic.kg',
  name: 'Айбек Дуйшеев',
  position: 'Ген. секретарь',
  department: 'Аппарат',
};

export function fakeApi(routes: Routes, permissions: Permission[] = []) {
  const calls: Call[] = [];
  const all: Routes = {
    'GET /auth/me': {
      status: 'active',
      user: { ...me, roles: ['R3'], permissions },
    },
    'GET /absences': [],
    'GET /staff/absences': [],
    ...routes,
  };
  sessionToken.set('test-token');
  globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = new URL(String(input));
    const method = (init.method ?? 'GET').toUpperCase();
    const path = url.pathname.replace(/^\/api(?=\/)/, '').replace(/\/$/, '') || '/';
    const body = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
    calls.push({ method, path, body });
    const key = `${method} ${path}`;
    const route = key in all ? all[key] : all[`${method} ${path}/`];
    if (route === undefined) {
      return new Response(JSON.stringify({ detail: 'not found' }), { status: 404 });
    }
    const result = typeof route === 'function' ? (route as Handler)(body, url) : route;
    if (result === null) return new Response(null, { status: 204 });
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as unknown as typeof fetch;
  return calls;
}
