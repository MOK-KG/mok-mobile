import { useTranslation } from 'react-i18next';
import { Linking, Pressable, Text, View } from 'react-native';
import { useCan } from '@/features/auth';
import { errorText } from '@/shared/api/feedback';
import { useCalendarConnection, useDisconnectCalendar } from './events';

const caps = 'font-semibold text-[10px] uppercase tracking-[1.4px] text-dim';

const webProfileUrl = () =>
  `${(process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/api\/?$/, '')}/profile`;

export function GoogleCalendarPanel() {
  const { t } = useTranslation();
  const { can } = useCan();
  const connection = useCalendarConnection();
  const disconnect = useDisconnectCalendar();
  if (!can('calendar.view')) return null;
  const c = connection.data;
  const link = 'font-medium text-[13px] text-info';
  return (
    <View className="gap-2 rounded-14 border border-line bg-panel p-4">
      <Text className={caps}>{t('profile.calendar.title')}</Text>
      <Text className="font-regular text-[12px] leading-[17px] text-faint">
        {t('profile.calendar.hint')}
      </Text>
      {connection.isError ? (
        <Text className="font-regular text-[12.5px] text-dim">
          {errorText(connection.error, t)}
        </Text>
      ) : !c ? null : c.connected ? (
        <>
          <Text className="font-regular text-[13px] text-text">
            {t('profile.calendar.connectedAs', { email: c.email })}
          </Text>
          {c.needsReconnect && (
            <Text className="font-regular text-[12.5px] text-warning-text">
              {t('profile.calendar.needsReconnect')}
            </Text>
          )}
          <View className="flex-row gap-5">
            {c.needsReconnect && (
              <Pressable accessibilityRole="link" onPress={() => Linking.openURL(webProfileUrl())}>
                <Text className={link}>{t('profile.calendar.reconnect')}</Text>
              </Pressable>
            )}
            <Pressable
              accessibilityRole="button"
              disabled={disconnect.isPending}
              onPress={() => disconnect.mutate()}
            >
              <Text className="font-medium text-[13px] text-sub">
                {t('profile.calendar.disconnect')}
              </Text>
            </Pressable>
          </View>
        </>
      ) : (
        <Pressable accessibilityRole="link" onPress={() => Linking.openURL(webProfileUrl())}>
          <Text className={link}>{t('profile.calendar.connect')}</Text>
        </Pressable>
      )}
    </View>
  );
}
