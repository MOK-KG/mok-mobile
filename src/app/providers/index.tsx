import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import {
  focusManager,
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { type ReactNode, useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import i18n from '@/app/i18n';
import { sessionQueryKey } from '@/features/auth/useSession';
import { ApiError } from '@/shared/api/errors';
import { createFeedbackHandlers } from '@/shared/api/feedback';
import { Toaster } from '@/shared/ui/Toaster';
import { ThemeProvider } from './ThemeProvider';

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => {
    // Успех и ошибки запросов — в одном месте: тосты, 401/403 → перечитать сессию
    const feedback = createFeedbackHandlers({
      t: (key, params) => i18n.t(key, params),
      sessionKey: sessionQueryKey,
      getClient: () => client,
    });
    const client = new QueryClient({
      queryCache: new QueryCache({ onError: feedback.onQueryError }),
      mutationCache: new MutationCache({
        onError: (error, _vars, _ctx, mutation) => feedback.onMutationError(error, mutation.meta),
        onSuccess: (data, _vars, _ctx, mutation) => feedback.onMutationSuccess(data, mutation.meta),
      }),
      defaultOptions: {
        queries: {
          staleTime: 30_000,
          // Повторять имеет смысл только сбои сети и сервера; 4xx от повтора не исправится
          retry: (count, error) =>
            count < 1 &&
            (!(error instanceof ApiError) || error.status === 0 || error.status >= 500),
        },
      },
    });
    return client;
  });

  // Возврат приложения из фона = «фокус окна» для TanStack Query
  useEffect(() => {
    const sub = AppState.addEventListener('change', (status) => {
      if (Platform.OS !== 'web') focusManager.setFocused(status === 'active');
    });
    return () => sub.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <BottomSheetModalProvider>{children}</BottomSheetModalProvider>
            <Toaster />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
