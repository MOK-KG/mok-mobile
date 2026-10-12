import * as SecureStore from 'expo-secure-store';

/**
 * Небольшие значения (настройки, токен сессии) в SecureStore.
 * Ошибки не роняют приложение: настройка просто не сохранится.
 */
export const storage = {
  get(key: string): string | null {
    try {
      return SecureStore.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      SecureStore.setItem(key, value);
    } catch {
      // хранилище недоступно
    }
  },
  remove(key: string) {
    SecureStore.deleteItemAsync(key).catch(() => {});
  },
};
