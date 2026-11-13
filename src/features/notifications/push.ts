import * as Notifications from 'expo-notifications';
import { type Href, router } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { api } from '@/shared/api/client';
import { storage } from '@/shared/lib/storage';

const PUSH_TOKEN_KEY = 'nok.pushToken';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function routeFor(data: Record<string, unknown> | undefined): Href {
  if (typeof data?.taskId === 'string') return `/tasks/${data.taskId}`;
  if (typeof data?.chatId === 'string') return `/chat/${data.chatId}`;
  if (data?.target === 'mailQueue') return '/tasks/queue';
  return '/notifications';
}

export async function registerForPush(): Promise<string | null> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted && permission.canAskAgain) {
    permission = await Notifications.requestPermissionsAsync();
  }
  if (!permission.granted) return null;
  const { data: token } = await Notifications.getExpoPushTokenAsync();
  await api.post('/notifications/devices', { token, platform: Platform.OS });
  storage.set(PUSH_TOKEN_KEY, token);
  return token;
}

export async function unregisterPush(): Promise<void> {
  const token = storage.get(PUSH_TOKEN_KEY);
  if (!token) return;
  storage.remove(PUSH_TOKEN_KEY);
  await api.delete('/notifications/devices', { body: { token } });
}

export function usePushNotifications(active: boolean) {
  const last = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (!active) return;
    registerForPush().catch(() => {});
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      router.push(routeFor(response.notification.request.content.data));
    });
    return () => subscription.remove();
  }, [active]);

  useEffect(() => {
    if (active && last) router.push(routeFor(last.notification.request.content.data));
  }, [active, last]);
}
