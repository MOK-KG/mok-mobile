import '@/global.css';
import '@/app/i18n';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { AppProviders } from '@/app/providers';
import { useSession } from '@/features/auth';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded && fontError === null) return null;

  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}

/**
 * Доступ к экранам по статусу сессии: без сессии — только вход, без роли — только
 * «Аккаунт на проверке», с ролью — приложение. Прямые ссылки на закрытые экраны не открываются.
 */
function RootNavigator() {
  const session = useSession();
  const status = session.data?.status ?? 'guest';

  useEffect(() => {
    if (!session.isPending) SplashScreen.hideAsync();
  }, [session.isPending]);

  if (session.isPending) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Protected guard={status === 'guest'}>
        <Stack.Screen name="login" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'pending'}>
        <Stack.Screen name="pending" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'active'}>
        <Stack.Screen name="index" />
        <Stack.Screen name="[section]" />
      </Stack.Protected>
    </Stack>
  );
}
