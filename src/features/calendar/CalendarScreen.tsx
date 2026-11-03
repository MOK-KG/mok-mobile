import { router } from 'expo-router';
import { type ReactNode, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useCurrentAbsences } from '@/features/absences/api';
import { useCan } from '@/features/auth';
import { absenceOf } from '@/features/tasks/absences';
import { useTasks } from '@/features/tasks/api';
import { urgencyOf } from '@/features/tasks/deadline';
import { currentUserId } from '@/features/tasks/directory';
import { TaskListItem } from '@/features/tasks/list/TaskListItem';
import { Avatar } from '@/features/tasks/parts';
import { themes } from '@/shared/config/tokens';
import { years } from '@/shared/config/workCalendar';
import { formatIsoDate } from '@/shared/lib/date';
import { type IsoDate, todayInBishkek } from '@/shared/lib/workDays';
import { ChevronLeftIcon } from '@/shared/ui/icons';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import {
  type CalendarLayer,
  calendarLayers,
  type DayEvents,
  dayType,
  eventsByDay,
  holidayRanges,
  loadLevel,
  monthGrid,
  monthNorm,
  monthOf,
  shiftMonth,
} from './month';

const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase() + s.slice(1);

const layerDot: Record<CalendarLayer, string> = {
  mine: 'bg-info',
  department: 'bg-faint',
  absences: 'bg-tone-cyan',
};

/**
 * Календарь (из вкладки «Ещё»): месяц по производственному календарю КР, точки сроков
 * и отпусков в днях; ниже — выбранный день и норма месяца. Логика — общая с вебом (month.ts).
 */
export function CalendarScreen() {
  const { t, i18n } = useTranslation();
  const palette = themes[useTheme().theme];
  const { can } = useCan();
  const canTasks = can('tasks.view');
  const today = todayInBishkek();
  const [selected, setSelected] = useState<IsoDate>(today);
  const [month, setMonth] = useState(monthOf(today));
  const [layers, setLayers] = useState<Set<CalendarLayer>>(() => new Set(calendarLayers));
  const tasks = useTasks('department');

  const weeks = useMemo(() => monthGrid(month), [month]);
  const norm = useMemo(() => monthNorm(month), [month]);
  const absenceList = useCurrentAbsences().data;
  const absences = useMemo(() => absenceList ?? [], [absenceList]);
  const available = calendarLayers.filter((l) => canTasks || l === 'absences');
  const events = useMemo(
    () =>
      eventsByDay(
        [...weeks.flat(), selected],
        canTasks ? (tasks.data ?? []) : [],
        absences,
        new Set([...layers].filter((l) => canTasks || l === 'absences')),
        currentUserId,
      ),
    [weeks, selected, tasks.data, absences, layers, canTasks],
  );

  const pick = (day: IsoDate) => {
    setSelected(day);
    setMonth(monthOf(day));
  };
  const toggle = (layer: CalendarLayer) =>
    setLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return next;
    });

  const monthTitle = capitalize(formatIsoDate(`${month}-01`, 'LLLL yyyy', i18n.language));
  const weekdays = weeks[0].map((d) => formatIsoDate(d, 'EEEEEE', i18n.language));

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScreenHeader title={t('sections.calendar')} fallback="/more" />
      <ScrollView contentContainerClassName="gap-3 px-4 pb-8 pt-1">
        <View className="flex-row items-center justify-between">
          <NavButton label={t('calendar.prev')} onPress={() => setMonth(shiftMonth(month, -1))}>
            <ChevronLeftIcon size={16} color={palette.sub} />
          </NavButton>
          <View className="items-center">
            <Text
              accessibilityLiveRegion="polite"
              className="font-semibold text-[15px] tracking-[-0.2px] text-text"
            >
              {monthTitle}
            </Text>
            <Text className="font-regular text-[11.5px] text-faint">
              {t('calendar.norm', { count: norm.workingDays, hours: norm.hours })}
            </Text>
          </View>
          <NavButton label={t('calendar.next')} onPress={() => setMonth(shiftMonth(month, 1))}>
            <View style={{ transform: [{ rotate: '180deg' }] }}>
              <ChevronLeftIcon size={16} color={palette.sub} />
            </View>
          </NavButton>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-[7px]"
        >
          <Pressable
            accessibilityRole="button"
            disabled={selected === today && month === monthOf(today)}
            onPress={() => pick(today)}
            className="h-8 justify-center rounded-8 border border-line bg-panel px-3 disabled:opacity-50"
          >
            <Text className="font-medium text-[12px] text-sub">{t('calendar.today')}</Text>
          </Pressable>
          {available.map((layer) => {
            const on = layers.has(layer);
            return (
              <Pressable
                key={layer}
                accessibilityRole="switch"
                accessibilityState={{ checked: on }}
                onPress={() => toggle(layer)}
                className={`h-8 flex-row items-center gap-[6px] rounded-8 border px-3 ${
                  on ? 'border-transparent bg-control-active' : 'border-line bg-panel'
                }`}
              >
                <View className={`size-2 rounded-full ${on ? layerDot[layer] : 'bg-dim'}`} />
                <Text
                  className={`text-[12px] ${on ? 'font-medium text-text' : 'font-regular text-faint'}`}
                >
                  {t(`calendar.layer.${layer}`)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {!norm.official && (
          <View className="rounded-9 border border-warning-line bg-warning-soft px-3 py-2">
            <Text className="font-regular text-[11.5px] leading-4 text-warning-text">
              {t('calendar.unofficial', { year: month.slice(0, 4) })}
            </Text>
          </View>
        )}

        <View className="overflow-hidden rounded-14 border border-line bg-panel">
          <View className="flex-row border-b border-line">
            {weekdays.map((w, i) => (
              <Text
                key={w}
                className={`flex-1 py-2 text-center font-semibold text-[10px] uppercase ${
                  i >= 5 ? 'text-dim' : 'text-faint'
                }`}
              >
                {w}
              </Text>
            ))}
          </View>
          {weeks.map((week) => (
            <View key={week[0]} className="flex-row">
              {week.map((day) => (
                <DayCell
                  key={day}
                  day={day}
                  inMonth={monthOf(day) === month}
                  today={day === today}
                  selected={day === selected}
                  events={events.get(day)}
                  onPress={() => pick(day)}
                />
              ))}
            </View>
          ))}
        </View>

        <DayDetails day={selected} events={events.get(selected)} />
        <MonthNorm month={month} norm={norm} />
      </ScrollView>
    </SafeAreaView>
  );
}

function NavButton({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      className="size-9 items-center justify-center rounded-9 border border-line bg-control"
    >
      {children}
    </Pressable>
  );
}

function DayCell({
  day,
  inMonth,
  today,
  selected,
  events,
  onPress,
}: {
  day: IsoDate;
  inMonth: boolean;
  today: boolean;
  selected: boolean;
  events: DayEvents | undefined;
  onPress: () => void;
}) {
  const { t, i18n } = useTranslation();
  const type = dayType(day);
  const off = type.type !== 'working';
  const deadlines = events?.deadlines ?? [];
  const absences = events?.absences ?? [];
  const overdue = deadlines.some((x) => urgencyOf(x).urgency === 'overdue');
  const mine = deadlines.some((x) => x.assignee?.id === currentUserId);
  const others = deadlines.some((x) => x.assignee?.id !== currentUserId);
  const label = [
    formatIsoDate(day, 'EEEE, d MMMM', i18n.language),
    type.type === 'holiday' ? t(`holidays.${type.holiday}`) : null,
    deadlines.length ? t('calendar.deadlinesCount', { count: deadlines.length }) : null,
    absences.length ? t('calendar.absentCount', { count: absences.length }) : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`h-[52px] flex-1 items-center gap-[3px] pt-[6px] ${
        loadLevel(events) === 3 ? 'bg-warning-soft' : off ? 'bg-surface' : ''
      } ${selected ? 'border-2 border-info' : ''} ${inMonth ? '' : 'opacity-40'}`}
    >
      <View
        className={`size-6 items-center justify-center rounded-full ${today ? 'bg-brand-red' : ''}`}
      >
        <Text
          className={`text-[12.5px] ${
            today
              ? 'font-semibold text-[#FFFFFF]'
              : type.type === 'holiday'
                ? 'font-semibold text-danger'
                : off
                  ? 'font-regular text-dim'
                  : 'font-regular text-text'
          }`}
        >
          {Number(day.slice(8))}
        </Text>
      </View>
      <View className="flex-row gap-[3px]">
        {overdue && <View className="size-[5px] rounded-full bg-danger" />}
        {mine && !overdue && <View className="size-[5px] rounded-full bg-info" />}
        {others && <View className="size-[5px] rounded-full bg-faint" />}
        {absences.length > 0 && <View className="size-[5px] rounded-full bg-tone-cyan" />}
        {type.type === 'working' && type.shortened && (
          <View className="size-[5px] rounded-full bg-warning" />
        )}
      </View>
    </Pressable>
  );
}

function DayDetails({ day, events }: { day: IsoDate; events: DayEvents | undefined }) {
  const { t, i18n } = useTranslation();
  const type = dayType(day);
  const deadlines = events?.deadlines ?? [];
  const absences = events?.absences ?? [];
  const date = (d: IsoDate) => formatIsoDate(d, 'd MMM', i18n.language).replace('.', '');
  const typeLabel =
    type.type === 'holiday'
      ? t(`holidays.${type.holiday}`)
      : type.type === 'weekend'
        ? t('dashboard.dayKind.weekend')
        : `${t(`dashboard.dayKind.${type.shortened ? 'shortened' : 'working'}`)} · ${t(
            'calendar.hours',
            { count: type.shortened ? 7 : 8 },
          )}`;

  return (
    <View className="overflow-hidden rounded-14 border border-line bg-panel">
      <View className="border-b border-line px-4 py-3">
        <Text className="font-semibold text-[15px] tracking-[-0.2px] text-text">
          {capitalize(formatIsoDate(day, 'EEEE, d MMMM', i18n.language))}
        </Text>
        <Text
          className={`mt-[2px] font-regular text-[12px] ${
            type.type === 'holiday' ? 'text-danger' : 'text-faint'
          }`}
        >
          {typeLabel}
        </Text>
      </View>
      <SectionTitle title={t('calendar.deadlines')} count={deadlines.length} />
      {deadlines.length === 0 ? (
        <Empty text={t('calendar.noDeadlines')} />
      ) : (
        deadlines.map((task) => (
          <View key={task.id} className="border-t border-line">
            <TaskListItem task={task} onPress={() => router.push(`/tasks/${task.id}`)} />
            {events?.conflicts.some((c) => c.id === task.id) && (
              <Text className="px-4 pb-2 font-regular text-[11.5px] text-tone-cyan">
                {t('calendar.conflict', {
                  name: task.assignee?.short,
                  deputy: absenceOf(task.assignee?.id, day)?.deputy.short ?? '—',
                })}
              </Text>
            )}
          </View>
        ))
      )}
      <SectionTitle title={t('calendar.absent')} count={absences.length} border />
      {absences.length === 0 ? (
        <Empty text={t('dashboard.noAbsences')} />
      ) : (
        <View className="pb-2">
          {absences.map((a) => (
            <View key={a.person.id} className="flex-row items-center gap-[10px] px-4 py-2">
              <Avatar person={a.person} size={28} />
              <View className="min-w-0 flex-1">
                <Text numberOfLines={1} className="font-regular text-[13px] text-text">
                  {a.person.name}
                </Text>
                <Text numberOfLines={1} className="font-regular text-[11px] text-faint">
                  {t('dashboard.absentFrom', { from: date(a.from), to: date(a.to) })}
                  {' · '}
                  {t('dashboard.deputy', { name: a.deputy.short })}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function MonthNorm({ month, norm }: { month: string; norm: ReturnType<typeof monthNorm> }) {
  const { t, i18n } = useTranslation();
  const date = (d: IsoDate) => formatIsoDate(d, 'd MMMM', i18n.language);
  const source = years[Number(month.slice(0, 4))]?.source;
  const row = (label: string, value: string) => (
    <View className="flex-row justify-between">
      <Text className="font-regular text-[12.5px] text-faint">{label}</Text>
      <Text className="font-regular text-[12.5px] text-text">{value}</Text>
    </View>
  );
  return (
    <View className="gap-[6px] rounded-14 border border-line bg-panel px-4 py-3">
      <Text className="font-semibold text-[10px] uppercase tracking-[1.4px] text-dim">
        {t('calendar.monthTitle', {
          month: formatIsoDate(`${month}-01`, 'LLLL', i18n.language),
        })}
      </Text>
      {row(t('calendar.workingDaysLabel'), String(norm.workingDays))}
      {row(t('calendar.hoursLabel'), String(norm.hours))}
      {holidayRanges(norm.holidays).map((h) => (
        <View key={h.from} className="flex-row justify-between gap-2">
          <Text numberOfLines={1} className="shrink font-regular text-[12px] text-sub">
            {t(`holidays.${h.holiday}`)}
          </Text>
          <Text className="font-regular text-[12px] text-dim">
            {h.from === h.to ? date(h.from) : `${Number(h.from.slice(8))}–${date(h.to)}`}
          </Text>
        </View>
      ))}
      {norm.shortened.length > 0 && (
        <Text className="font-regular text-[11.5px] text-faint">
          {t('calendar.shortenedDays', { dates: norm.shortened.map(date).join(', ') })}
        </Text>
      )}
      {norm.official && source && (
        <Text className="mt-1 font-regular text-[10.5px] leading-[15px] text-dim">
          {t('calendar.source', { source })}
        </Text>
      )}
    </View>
  );
}

function SectionTitle({
  title,
  count,
  border,
}: {
  title: string;
  count: number;
  border?: boolean;
}) {
  return (
    <View
      className={`flex-row items-baseline gap-2 px-4 pb-1 pt-3 ${border ? 'border-t border-line' : ''}`}
    >
      <Text className="font-semibold text-[10px] uppercase tracking-[1.4px] text-dim">{title}</Text>
      <Text className="font-medium text-[10.5px] text-dim">{count}</Text>
    </View>
  );
}

const Empty = ({ text }: { text: string }) => (
  <Text className="px-4 pb-3 pt-1 font-regular text-[12px] text-dim">{text}</Text>
);
