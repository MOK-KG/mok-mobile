import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { type ComponentType, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useChats } from '@/features/chat/api';
import { useMailQueueSummary } from '@/features/tasks/api';
import { useOpenTaskByTitle } from '@/features/tasks/useOpenTaskByTitle';
import { type ThemeColorName, themes } from '@/shared/config/tokens';
import { formatIsoDate, relativeShort } from '@/shared/lib/date';
import { diffDays, todayInBishkek } from '@/shared/lib/workDays';
import {
  AtSignIcon,
  BellIcon,
  BoltIcon,
  CheckDoubleIcon,
  CheckSmallIcon,
  ClockIcon,
  MailIcon,
} from '@/shared/ui/icons';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import { Tooltip } from '@/shared/ui/Tooltip';
import {
  type AppNotification,
  type NotificationKind,
  useMarkAllRead,
  useMarkRead,
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
  reminder: { Icon: BellIcon, stripe: 'bg-info', color: 'sub' },
  done: { Icon: CheckSmallIcon, stripe: 'bg-success', color: 'success' },
};

type Filter = 'all' | 'unread' | 'mentions';

const filters: { id: Filter; label: string; empty: string }[] = [
  { id: 'all', label: 'notifications.all', empty: 'notifications.empty' },
  { id: 'unread', label: 'notifications.unreadTab', empty: 'notifications.emptyUnread' },
  { id: 'mentions', label: 'notifications.mentions', empty: 'notifications.emptyMentions' },
];

const matches = (n: AppNotification, f: Filter) =>
  f === 'all' || (f === 'unread' ? !n.read : n.kind === 'mention');

/** Уведомления (на web — всплывающее окно в шапке) */
export function NotificationsScreen() {
  const { t } = useTranslation();
  const palette = themes[useTheme().theme];
  const notifications = useNotifications();
  const markAll = useMarkAllRead();
  const [filter, setFilter] = useState<Filter>('all');
  const queue = useMailQueueSummary().data;
  // Число писем в очереди — по факту очереди, а не из текста уведомления.
  // Пустая очередь — уведомление скрыто и не считается ни в одном счётчике (как useUnreadCount)
  const queueCount = queue ? queue.ready + queue.manual : 0;
  const shown = (notifications.data ?? []).filter((n) => n.kind !== 'mailQueue' || queueCount > 0);
  const data = shown.filter((n) => matches(n, filter));
  const unread = shown.filter((n) => !n.read).length;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScreenHeader
        title={t('notifications.title')}
        fallback="/more"
        right={
          unread > 0 && (
            <Tooltip content={t('notifications.readAll')}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${t('notifications.readAll')}, ${t('shell.unread', { count: unread })}`}
                onPress={() => markAll.mutate()}
                hitSlop={8}
                className="size-8 items-center justify-center rounded-8"
              >
                <CheckDoubleIcon size={16} color={palette.info} />
              </Pressable>
            </Tooltip>
          )
        }
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="max-h-12 grow-0"
        contentContainerClassName="items-center gap-[7px] px-4 py-[10px]"
      >
        {filters.map((f) => {
          const active = f.id === filter;
          return (
            <Pressable
              key={f.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              onPress={() => setFilter(f.id)}
              className={`h-7 flex-row items-center gap-[6px] rounded-8 border px-[9px] ${
                active ? 'border-transparent bg-control-active' : 'border-line bg-panel'
              }`}
            >
              <Text
                className={`text-[12px] tracking-[-0.1px] ${active ? 'font-semibold text-text' : 'font-regular text-sub'}`}
              >
                {t(f.label)}
              </Text>
              <Text
                className={`font-medium text-[10.5px] ${active ? 'text-tone-gold' : 'text-dim'}`}
              >
                {shown.filter((n) => matches(n, f.id)).length}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <FlashList
        data={data}
        extraData={queueCount}
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
              {t(filters.find((f) => f.id === filter)?.empty ?? 'notifications.empty')}
            </Text>
          )
        }
      />
    </SafeAreaView>
  );
}

/** Текст напоминания: в уведомлении лежит срок задачи (IsoDate), «через N дней» — от сегодня */
function useBodyText() {
  const { t, i18n } = useTranslation();
  const queue = useMailQueueSummary().data;
  return (n: AppNotification) => {
    // Письма в очереди: текст — по самой очереди, как в баннере на доске задач
    if (n.kind === 'mailQueue' && queue) {
      return t('mailQueue.subtitle', { mailbox: 'info@olympic.kg', ...queue });
    }
    if (n.kind !== 'reminder') return n.text;
    const date = formatIsoDate(n.text, 'd MMMM', i18n.language);
    const days = diffDays(todayInBishkek(), n.text);
    if (days === 0) return t('notifications.reminderToday', { date });
    return days > 0 ? t('notifications.reminderText', { count: days, date }) : date;
  };
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
  const markRead = useMarkRead();
  const openTask = useOpenTaskByTitle();
  const chats = useChats().data;
  const body = useBodyText();
  const target = n.target;

  const action = !target
    ? null
    : target.kind === 'task'
      ? t('notifications.openTask')
      : target.kind === 'mailQueue'
        ? t('notifications.review')
        : chats?.find((c) => c.id === target.chatId)?.kind === 'direct'
          ? t('notifications.openChat')
          : t('notifications.openChannel');

  const open = () => {
    if (!target) return;
    if (!n.read) markRead.mutate(n.id);
    if (target.kind === 'task') openTask(target.taskTitle);
    else if (target.kind === 'mailQueue') router.push('/tasks/queue');
    else router.push(`/chat/${target.chatId}`);
  };

  return (
    <View
      className={`relative flex-row gap-[10px] border-b border-line px-4 py-[14px] ${
        n.read ? 'bg-panel' : 'bg-row-highlight'
      }`}
    >
      {!n.read && <View className={`absolute bottom-0 left-0 top-0 w-[2.5px] ${kind.stripe}`} />}
      <View className={`size-[22px] items-center justify-center ${n.read ? 'opacity-70' : ''}`}>
        <kind.Icon size={16} color={palette[kind.color]} />
      </View>
      <View className="min-w-0 flex-1">
        <Text
          className={`font-medium text-[13px] leading-[18px] tracking-[-0.1px] ${n.read ? 'text-sub' : 'text-text'}`}
        >
          {title}
        </Text>
        <Text
          className={`mt-[2px] font-regular text-[12px] leading-[17px] ${n.read ? 'text-dim' : 'text-faint'}`}
        >
          {body(n)}
        </Text>
        {action && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${action}: ${title}`}
            onPress={open}
            className="mt-[10px] h-7 self-start justify-center rounded-8 border border-line bg-panel px-3 active:bg-control-active"
          >
            <Text className="font-medium text-[12px] text-sub">{action}</Text>
          </Pressable>
        )}
      </View>
      <Text className="font-regular text-[10.5px] text-dim">{relativeShort(n.at, t)}</Text>
    </View>
  );
}
