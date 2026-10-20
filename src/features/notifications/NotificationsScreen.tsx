import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import type { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useMailQueueSummary } from '@/features/tasks/api';
import { type ThemeColorName, themes } from '@/shared/config/tokens';
import { relativeShort } from '@/shared/lib/date';
import {
  AtSignIcon,
  BoltIcon,
  CheckDoubleIcon,
  CheckSmallIcon,
  ClockIcon,
  MailIcon,
} from '@/shared/ui/icons';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import {
  type AppNotification,
  type NotificationKind,
  useMarkAllRead,
  useNotifications,
} from './api';

const kinds: Record<
  NotificationKind,
  { Icon: ComponentType<{ size?: number; color: string }>; stripe: string; color: ThemeColorName }
> = {
  escalation: { Icon: BoltIcon, stripe: 'bg-warning', color: 'warning' },
  overdue: { Icon: ClockIcon, stripe: 'bg-brand-red', color: 'danger' },
  mailQueue: { Icon: MailIcon, stripe: 'bg-brand-gold', color: 'tone-gold' },
  mention: { Icon: AtSignIcon, stripe: 'bg-info', color: 'info' },
  done: { Icon: CheckSmallIcon, stripe: 'bg-success', color: 'success' },
};

/** Уведомления (на web — всплывающее окно в шапке) */
export function NotificationsScreen() {
  const { t } = useTranslation();
  const palette = themes[useTheme().theme];
  const notifications = useNotifications();
  const markAll = useMarkAllRead();
  const queue = useMailQueueSummary().data;
  // Число писем в очереди — по факту очереди, а не из текста уведомления
  const queueCount = queue ? queue.ready + queue.manual : 0;
  const data = (notifications.data ?? []).filter((n) => n.kind !== 'mailQueue' || queueCount > 0);
  const unread = data.filter((n) => !n.read).length;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScreenHeader
        title={t('shell.notifications')}
        right={
          unread > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${t('shell.readAll')}, ${t('shell.unread', { count: unread })}`}
              onPress={() => markAll.mutate()}
              hitSlop={6}
              className="flex-row items-center gap-1 pr-1"
            >
              <CheckDoubleIcon size={14} color={palette.info} />
              <Text className="font-medium text-[12px] text-info">{t('shell.readAll')}</Text>
            </Pressable>
          )
        }
      />
      <FlashList
        data={data}
        keyExtractor={(n) => n.id}
        renderItem={({ item }) => (
          <NotificationRow
            notification={item}
            title={
              item.kind === 'mailQueue'
                ? t('mailQueue.mailQueueNote', { count: queueCount })
                : item.title
            }
            palette={palette}
          />
        )}
        ListEmptyComponent={
          notifications.isPending ? null : (
            <Text className="py-10 text-center font-regular text-[13px] text-faint">
              {t('shell.noNotifications')}
            </Text>
          )
        }
      />
    </SafeAreaView>
  );
}

function NotificationRow({
  notification: n,
  title,
  palette,
}: {
  notification: AppNotification;
  title: string;
  palette: Record<ThemeColorName, string>;
}) {
  const { t } = useTranslation();
  const kind = kinds[n.kind];
  const open = () => {
    if (n.kind === 'mailQueue') router.push('/tasks/queue');
  };
  return (
    <Pressable
      accessibilityRole={n.kind === 'mailQueue' ? 'link' : undefined}
      disabled={n.kind !== 'mailQueue'}
      onPress={open}
      className={`relative flex-row gap-[10px] border-b border-line px-4 py-[14px] ${
        n.read ? 'bg-panel' : 'bg-row-highlight'
      }`}
    >
      {!n.read && <View className={`absolute bottom-0 left-0 top-0 w-[2.5px] ${kind.stripe}`} />}
      <View className="size-[22px] items-center justify-center">
        <kind.Icon size={16} color={palette[kind.color]} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-medium text-[13px] leading-[18px] tracking-[-0.1px] text-text">
          {title}
        </Text>
        <Text className="mt-[2px] font-regular text-[12px] leading-[17px] text-faint">
          {n.text}
        </Text>
      </View>
      <Text className="font-regular text-[10.5px] text-dim">{relativeShort(n.at, t)}</Text>
    </Pressable>
  );
}
