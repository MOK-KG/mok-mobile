import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useSession } from '@/features/auth';
import { useUnreadCount } from '@/features/notifications/useUnreadCount';
import { themes } from '@/shared/config/tokens';
import { formatIsoDate } from '@/shared/lib/date';
import { todayInBishkek } from '@/shared/lib/workDays';
import { BellIcon } from '@/shared/ui/icons';
import { TabHeader } from '@/shared/ui/TabHeader';

/** Рабочий стол: приветствие и дата; сам раздел появится по макету */
export function DashboardScreen() {
  const { t, i18n } = useTranslation();
  const palette = themes[useTheme().theme];
  const user = useSession().data?.user;
  const unread = useUnreadCount();
  const today = formatIsoDate(todayInBishkek(), 'EEEE, d MMMM', i18n.language);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <TabHeader
        title={t('sections.dashboard')}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${t('shell.notifications')}${unread ? `, ${t('shell.unread', { count: unread })}` : ''}`}
            onPress={() => router.push('/notifications')}
            hitSlop={6}
            className="size-8 items-center justify-center rounded-9 border border-line bg-control"
          >
            <BellIcon size={16} color={palette.sub} />
            {unread > 0 && (
              <View className="absolute right-[6px] top-[6px] size-[7px] rounded-full border-[1.5px] border-control bg-brand-red" />
            )}
          </Pressable>
        }
      />
      <View className="m-4 gap-2 rounded-18 bg-card p-6">
        <Text className="font-semibold text-[18px] tracking-[-0.3px] text-text">
          {t('home.greeting', { name: user?.name })}
        </Text>
        <Text className="font-regular text-[13px] text-faint">
          {[user?.department, today].filter(Boolean).join(' · ')}
        </Text>
        <Text className="mt-3 font-regular text-[14px] text-sub">{t('sections.placeholder')}</Text>
      </View>
    </SafeAreaView>
  );
}
