import DateTimePicker from '@react-native-community/datetimepicker';
import { type ComponentType, type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, Text, View } from 'react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { themes } from '@/shared/config/tokens';
import { formatIsoDate, isoToLocalDate, localDateToIso } from '@/shared/lib/date';
import { initials } from '@/shared/lib/text';
import { type IsoDate, todayInBishkek } from '@/shared/lib/workDays';
import { CalendarMediumIcon, CheckIcon, DuplicateIcon } from '@/shared/ui/icons';
import type { DueProblem } from './deadline';
import { people } from './directory';
import type { Person, Task, TaskStatus } from './types';
import { toneClasses } from './ui';

/** Общие куски экранов задач на мобильном: карточка, новая задача, очередь из почты */

export const usePalette = () => themes[useTheme().theme];

export const sectionTitle = 'font-semibold text-[10px] uppercase tracking-[1.4px] text-dim';

export const statusChip: Record<TaskStatus, string> = {
  queue: 'bg-chip text-chip-text',
  in_progress: 'bg-info-chip text-info',
  review: 'bg-warning-chip text-warning-text',
  done: 'bg-tone-green-bg text-tone-green',
};

/** Сотрудники, которых можно назначить исполнителем (заглушка, как в web) */
export const staff: Person[] = [people.ad, people.nb, people.dt, people.ka, people.me];

/** Ключ ошибки срока для перевода newTask.* (праздник — через «|») */
export const dueMessage = (p: DueProblem) =>
  p.code === 'past'
    ? 'errorDuePast'
    : p.code === 'weekend'
      ? 'errorDueWeekend'
      : `errorDueHoliday|${p.holiday}`;

export function useErrorText() {
  const { t } = useTranslation();
  return (message?: string) => {
    if (!message) return null;
    const [key, holiday] = message.split('|');
    return t(`newTask.${key}`, { name: holiday ? t(`holidays.${holiday}`) : '' });
  };
}

export function Avatar({ person, size = 20 }: { person: Person; size?: number }) {
  const tone = toneClasses[person.tone];
  return (
    <View
      accessibilityLabel={person.name}
      style={{ width: size, height: size }}
      className={`items-center justify-center rounded-full ${tone.bg}`}
    >
      <Text style={{ fontSize: size * 0.36 }} className={`font-semibold ${tone.text}`}>
        {initials(person.name)}
      </Text>
    </View>
  );
}

type IconType = ComponentType<{ size?: number; color: string }>;

const noticeTones = {
  warning: { box: 'border-warning-line bg-warning-soft', text: 'text-warning-text' },
  info: { box: 'border-info-line bg-info-chip', text: 'text-info-text' },
  neutral: { box: 'border-line bg-surface', text: 'text-sub' },
} as const;

/** Плашка с иконкой: эскалация, отпуск, переносы срока, напоминание */
export function Notice({
  tone,
  Icon,
  title,
  children,
  stripe = false,
}: {
  tone: keyof typeof noticeTones;
  Icon: IconType;
  title: string;
  children?: ReactNode;
  /** Цветная полоса слева, как у предупреждений */
  stripe?: boolean;
}) {
  const palette = usePalette();
  const color = {
    warning: palette['warning-text'],
    info: palette['info-text'],
    neutral: palette.sub,
  }[tone];
  return (
    <View
      accessibilityRole="summary"
      className={`relative flex-row gap-[9px] overflow-hidden rounded-9 border px-3 py-2 ${noticeTones[tone].box}`}
    >
      {stripe && <View className="absolute bottom-0 left-0 top-0 w-[2.5px] bg-warning" />}
      <View className="mt-px">
        <Icon size={15} color={color} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className={`font-semibold text-[12px] tracking-[-0.1px] ${noticeTones[tone].text}`}>
          {title}
        </Text>
        {children}
      </View>
    </View>
  );
}

export function NoticeText({ children }: { children: ReactNode }) {
  return <Text className="mt-[2px] font-regular text-[11.5px] leading-4 text-sub">{children}</Text>;
}

/** Похожие активные задачи: предупреждают, но не блокируют создание */
export function DuplicatesNotice({
  tasks,
  onOpen,
}: {
  tasks: Task[];
  onOpen?: (id: string) => void;
}) {
  const { t, i18n } = useTranslation();
  if (tasks.length === 0) return null;
  return (
    <Notice tone="warning" stripe Icon={DuplicateIcon} title={t('newTask.duplicatesTitle')}>
      {tasks.map((task) => (
        <Pressable
          key={task.id}
          accessibilityRole={onOpen ? 'link' : undefined}
          disabled={!onOpen}
          onPress={() => onOpen?.(task.id)}
        >
          <Text numberOfLines={1} className="mt-[2px] font-regular text-[11.5px] text-sub">
            {t('newTask.duplicateLine', {
              title: task.title,
              status: t(`tasks.status.${task.status}`).toLocaleLowerCase(i18n.language),
            })}
            {onOpen && (
              <Text className="font-medium text-warning-text"> · {t('newTask.open')}</Text>
            )}
          </Text>
        </Pressable>
      ))}
    </Notice>
  );
}

/** Выбор одного варианта: чипы с переносом строк вместо выпадающего списка */
export function Choices<V extends string>({
  label,
  value,
  options,
  onChange,
  invalid = false,
}: {
  label: string;
  value: V | null;
  options: { value: V; label: string; prefix?: ReactNode }[];
  onChange: (value: V) => void;
  invalid?: boolean;
}) {
  const palette = usePalette();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      className="flex-row flex-wrap gap-2"
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            onPress={() => onChange(o.value)}
            className={`h-9 flex-row items-center gap-[6px] rounded-8 border px-[10px] ${
              active
                ? 'border-info bg-popover-active'
                : invalid
                  ? 'border-danger bg-column'
                  : 'border-line bg-column'
            }`}
          >
            {o.prefix}
            <Text
              className={`text-[12.5px] ${active ? 'font-medium text-text' : 'font-regular text-sub'}`}
            >
              {o.label}
            </Text>
            {active && <CheckIcon size={13} color={palette.info} />}
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Поле срока: дата с днём недели, по нажатию — нативный календарь.
 * Значение — IsoDate; прошлые дни в календаре недоступны.
 */
export function DueField({
  value,
  onChange,
  label,
  invalid = false,
}: {
  value: IsoDate | null;
  onChange: (value: IsoDate) => void;
  label: string;
  invalid?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const palette = usePalette();
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const today = todayInBishkek();

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={value ? formatIsoDate(value, 'EEEE, d MMMM yyyy', i18n.language) : ''}
        onPress={() => setOpen((o) => !o)}
        className={`h-[42px] flex-row items-center gap-2 rounded-8 border bg-column px-[11px] ${
          invalid ? 'border-danger' : open ? 'border-info' : 'border-line'
        }`}
      >
        <CalendarMediumIcon size={17} color={palette.faint} />
        <Text
          className={`flex-1 text-[13px] ${value ? 'font-regular text-text' : 'font-regular text-dim'}`}
        >
          {value ? formatIsoDate(value, 'EEEE, d MMMM yyyy', i18n.language) : '—'}
        </Text>
      </Pressable>
      {open && Platform.OS !== 'ios' && (
        // Android показывает системный диалог и закрывает его сам
        <DateTimePicker
          value={isoToLocalDate(value ?? today)}
          minimumDate={isoToLocalDate(today)}
          mode="date"
          onChange={(event, date) => {
            setOpen(false);
            if (event.type === 'set' && date) onChange(localDateToIso(date));
          }}
        />
      )}
      {open && Platform.OS === 'ios' && (
        <View className="mt-2 overflow-hidden rounded-12 border border-line bg-column">
          <DateTimePicker
            value={isoToLocalDate(value ?? today)}
            minimumDate={isoToLocalDate(today)}
            mode="date"
            display="inline"
            themeVariant={theme}
            accentColor={palette.info}
            locale={i18n.language}
            onChange={(event, date) => {
              if (event.type === 'set' && date) onChange(localDateToIso(date));
            }}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => setOpen(false)}
            className="items-center border-t border-line py-[10px]"
          >
            <Text className="font-semibold text-[13px] text-info">{t('mailQueue.done')}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
