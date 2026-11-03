import { type Href, router } from 'expo-router';
import type { ComponentType, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useCurrentAbsences } from '@/features/absences/api';
import { useCan, useSession } from '@/features/auth';
import { useChatUnread } from '@/features/chat/api';
import {
  type DashboardSummary,
  dashboardSummary,
  nextHoliday,
  partOfDay,
  todayKind,
  workMonth,
} from '@/features/dashboard/summary';
import { useUnreadCount } from '@/features/notifications/useUnreadCount';
import { useMailQueueSummary, useTasks } from '@/features/tasks/api';
import { currentUserId } from '@/features/tasks/directory';
import { TaskListItem } from '@/features/tasks/list/TaskListItem';
import { Avatar } from '@/features/tasks/parts';
import { type ThemeColorName, themes } from '@/shared/config/tokens';
import { formatIsoDate } from '@/shared/lib/date';
import { todayInBishkek } from '@/shared/lib/workDays';
import {
  ArrowRightIcon,
  BellIcon,
  BoltSmallIcon,
  CalendarMediumIcon,
  ChatIcon,
  ClockIcon,
  MailLargeIcon,
  PlaneIcon,
  SearchIcon,
  TasksIcon,
} from '@/shared/ui/icons';
import { TabHeader } from '@/shared/ui/TabHeader';

const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase() + s.slice(1);

/** Сколько моих задач видно на рабочем столе; остальные — по ссылке «Все задачи» */
const MY_TASKS_SHOWN = 5;

/**
 * Рабочий стол: что требует внимания сегодня — как на вебе (features/dashboard/summary.ts),
 * без ленты уведомлений: она за колокольчиком в шапке. Блоки разделов без права не показываются.
 */
export function DashboardScreen() {
  const { t } = useTranslation();
  const palette = themes[useTheme().theme];
  const { can } = useCan();
  const canTasks = can('tasks.view');
  const unread = useUnreadCount();
  const tasks = useTasks('department');
  const today = todayInBishkek();
  const absences = useCurrentAbsences().data ?? [];
  const summary = dashboardSummary(tasks.data ?? [], absences, currentUserId, today);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <TabHeader
        title={t('sections.dashboard')}
        right={
          <View className="flex-row gap-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('search.label')}
              onPress={() => router.push('/search')}
              hitSlop={6}
              className="size-8 items-center justify-center rounded-9 border border-line bg-control"
            >
              <SearchIcon size={16} color={palette.sub} />
            </Pressable>
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
          </View>
        }
      />
      <ScrollView contentContainerClassName="gap-3 px-4 pb-8 pt-1">
        <Greeting />
        {canTasks && <Stats summary={summary} loading={tasks.isPending} />}
        {canTasks && <MyTasks summary={summary} loading={tasks.isPending} />}
        {canTasks && summary.escalations.length > 0 && <Escalations summary={summary} />}
        <Absences summary={summary} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Greeting() {
  const { t, i18n } = useTranslation();
  const palette = themes[useTheme().theme];
  const user = useSession().data?.user;
  const today = todayInBishkek();
  const month = workMonth(today);
  const holiday = nextHoliday(today);

  return (
    <View className="gap-[6px] rounded-14 border border-line bg-panel px-4 py-4">
      <Text className="font-semibold text-[18px] tracking-[-0.3px] text-text">
        {t(`dashboard.greeting.${partOfDay()}`, { name: user?.name.split(' ')[0] })}
      </Text>
      <Text className="font-regular text-[12px] text-faint">
        {capitalize(formatIsoDate(today, 'EEEE, d MMMM', i18n.language))}
        {' · '}
        {t(`dashboard.dayKind.${todayKind(today)}`)}
      </Text>
      <Text className="font-regular text-[12px] text-faint">
        {t('dashboard.workDaysLeft', { count: month.left, total: month.total })}
      </Text>
      {holiday && (
        <View className="mt-2 flex-row items-center gap-2 self-start rounded-9 border border-line bg-surface px-3 py-2">
          <CalendarMediumIcon size={14} color={palette['tone-gold']} />
          <Text className="shrink font-regular text-[12px] text-sub">
            {t('dashboard.nextHoliday', {
              name: t(`holidays.${holiday.holiday}`),
              date: formatIsoDate(holiday.date, 'd MMMM', i18n.language),
            })}
            <Text className="text-dim"> · {t('dashboard.inDays', { count: holiday.days })}</Text>
          </Text>
        </View>
      )}
    </View>
  );
}

type StatProps = {
  Icon: ComponentType<{ size?: number; color: string }>;
  label: string;
  value: number | undefined;
  href: Href;
  /** Цвет числа, если оно не ноль */
  tone?: ThemeColorName;
};

function Stat({ Icon, label, value, href, tone }: StatProps) {
  const palette = themes[useTheme().theme];
  const color = tone && value ? palette[tone] : palette.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value ?? '—'}`}
      onPress={() => router.push(href)}
      className="min-w-[45%] flex-1 gap-2 rounded-14 border border-line bg-panel px-[14px] py-3 active:bg-row-highlight"
    >
      <View className="flex-row items-center gap-[6px]">
        <Icon size={14} color={palette.faint} />
        <Text numberOfLines={1} className="shrink font-regular text-[11.5px] text-faint">
          {label}
        </Text>
      </View>
      <Text style={{ color }} className="font-semibold text-[22px] tracking-[-0.5px]">
        {value ?? '—'}
      </Text>
    </Pressable>
  );
}

function Stats({ summary, loading }: { summary: DashboardSummary; loading: boolean }) {
  const { t } = useTranslation();
  const { can } = useCan();
  const queue = useMailQueueSummary().data;
  const chatUnread = useChatUnread();
  const value = (n: number) => (loading ? undefined : n);

  return (
    <View className="flex-row flex-wrap gap-3">
      <Stat
        Icon={TasksIcon}
        label={t('dashboard.myTasks')}
        value={value(summary.mine.length)}
        href="/tasks"
      />
      <Stat
        Icon={ClockIcon}
        label={t('dashboard.overdue')}
        value={value(summary.overdue.length)}
        href="/tasks"
        tone="danger"
      />
      <Stat
        Icon={BoltSmallIcon}
        label={t('dashboard.soon')}
        value={value(summary.soon.length)}
        href="/tasks"
        tone="warning-text"
      />
      {can('tasks.create') && (
        <Stat
          Icon={MailLargeIcon}
          label={t('dashboard.mailQueue')}
          value={queue && queue.ready + queue.manual}
          href="/tasks/queue"
          tone="warning-text"
        />
      )}
      {can('chat.use') && (
        <Stat
          Icon={ChatIcon}
          label={t('dashboard.chatUnread')}
          value={chatUnread}
          href="/chat"
          tone="info"
        />
      )}
    </View>
  );
}

function Panel({
  title,
  count,
  link,
  stripe,
  children,
}: {
  title: string;
  count?: string;
  link?: { href: Href; label: string };
  stripe?: boolean;
  children: ReactNode;
}) {
  const palette = themes[useTheme().theme];
  return (
    <View className="overflow-hidden rounded-14 border border-line bg-panel">
      {stripe && <View className="absolute bottom-0 left-0 top-0 z-10 w-[3px] bg-warning" />}
      <View className="flex-row items-center justify-between px-4 pb-2 pt-[14px]">
        <View className="flex-row items-baseline gap-2">
          <Text className="font-semibold text-[14px] tracking-[-0.2px] text-text">{title}</Text>
          {count && <Text className="font-medium text-[11px] text-dim">{count}</Text>}
        </View>
        {link && (
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push(link.href)}
            hitSlop={8}
            className="flex-row items-center gap-[5px]"
          >
            <Text className="font-medium text-[12px] text-info">{link.label}</Text>
            <ArrowRightIcon size={13} color={palette.info} />
          </Pressable>
        )}
      </View>
      {children}
    </View>
  );
}

const Empty = ({ text }: { text: string }) => (
  <Text className="px-4 pb-4 pt-1 font-regular text-[12.5px] text-dim">{text}</Text>
);

function MyTasks({ summary, loading }: { summary: DashboardSummary; loading: boolean }) {
  const { t } = useTranslation();
  const shown = summary.mine.slice(0, MY_TASKS_SHOWN);
  const total = summary.mine.length;

  return (
    <Panel
      title={t('dashboard.myTasks')}
      count={
        loading
          ? undefined
          : total > shown.length
            ? t('dashboard.shownOf', { shown: shown.length, total })
            : String(total)
      }
      link={{ href: '/tasks', label: t('dashboard.allTasks') }}
    >
      {loading ? (
        <Empty text={t('dashboard.loading')} />
      ) : total === 0 ? (
        <Empty text={t('dashboard.noTasks')} />
      ) : (
        shown.map((task) => (
          <View key={task.id} className="border-t border-line">
            <TaskListItem task={task} onPress={() => router.push(`/tasks/${task.id}`)} />
          </View>
        ))
      )}
      {summary.toReview.length > 0 && (
        <Text className="border-t border-line px-4 py-3 font-regular text-[12px] text-faint">
          {t('dashboard.toReview', { count: summary.toReview.length })}
        </Text>
      )}
    </Panel>
  );
}

function Escalations({ summary }: { summary: DashboardSummary }) {
  const { t } = useTranslation();
  return (
    <Panel title={t('dashboard.escalations')} count={String(summary.escalations.length)} stripe>
      <Text className="px-4 pb-2 font-regular text-[11.5px] leading-4 text-faint">
        {t('dashboard.escalationsHint')}
      </Text>
      {summary.escalations.map((task) => (
        <View key={task.id} className="border-t border-line">
          <TaskListItem task={task} onPress={() => router.push(`/tasks/${task.id}`)} />
        </View>
      ))}
    </Panel>
  );
}

function Absences({ summary }: { summary: DashboardSummary }) {
  const { t, i18n } = useTranslation();
  const palette = themes[useTheme().theme];
  const date = (d: string) => formatIsoDate(d, 'd MMM', i18n.language).replace('.', '');
  const total = summary.absentNow.length + summary.absentSoon.length;
  const groups = [
    { key: 'now', items: summary.absentNow },
    { key: 'soon', items: summary.absentSoon },
  ] as const;

  return (
    <Panel title={t('dashboard.absences')} count={String(total)}>
      {total === 0 ? (
        <Empty text={t('dashboard.noAbsences')} />
      ) : (
        <View className="pb-2">
          {groups.map(
            ({ key, items }) =>
              items.length > 0 && (
                <View key={key}>
                  <Text className="px-4 pb-1 pt-2 font-semibold text-[10px] uppercase tracking-[1.4px] text-dim">
                    {t(`dashboard.absent.${key}`)}
                  </Text>
                  {items.map((a) => (
                    <View
                      key={`${a.person.id}-${a.from}`}
                      className="flex-row items-center gap-[10px] px-4 py-2"
                    >
                      <Avatar person={a.person} size={28} />
                      <View className="min-w-0 flex-1">
                        <Text numberOfLines={1} className="font-regular text-[13px] text-text">
                          {a.person.name}
                        </Text>
                        <Text numberOfLines={1} className="font-regular text-[11px] text-faint">
                          {key === 'now'
                            ? t('dashboard.absentUntil', { date: date(a.to) })
                            : t('dashboard.absentFrom', { from: date(a.from), to: date(a.to) })}
                          {' · '}
                          {t('dashboard.deputy', { name: a.deputy.short })}
                        </Text>
                      </View>
                      <PlaneIcon size={13} color={palette.info} />
                    </View>
                  ))}
                </View>
              ),
          )}
        </View>
      )}
    </Panel>
  );
}
