import { createApiClient } from './request';

/**
 * HTTP-клиент мобильного приложения: токен сессии передаёт сам вызов
 * (заголовок Authorization, см. features/auth/api.ts).
 * Типы API будут генерироваться из OpenAPI командой `pnpm api:sync`
 * в src/shared/api/schema.d.ts, когда появится бэкенд.
 */
export const api = createApiClient({
  baseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000',
});

export { ApiError } from './errors';
