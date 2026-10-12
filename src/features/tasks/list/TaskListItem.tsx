import type { ComponentType, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { themes } from '@/shared/config/tokens';
import { formatIsoDate } from '@/shared/lib/date';
import { initials } from '@/shared/lib/text';
import {
  BoltSmallIcon,
  CommentIcon,
  MailSmallIcon,
  PaperclipIcon,
  PlaneIcon,
  RescheduleIcon,
  SubtasksIcon,
} from '@/shared/ui/icons';
import { urgencyOf } from '../deadline';
import type { Task, TaskStatus } from '../types';
import { toneClasses } from '../ui';

const statusChip: Record<TaskStatus, string> = {
  queue: 'bg-chip text-chip-text',
  in_progress: 'bg-info-chip text-info',
  review: 'bg-warning-chip text-warning-text',
  done: 'bg-tone-green-bg text-tone-green',
};

function Chip({ className, children }: { className: string; children: ReactNode }) {
  return (
    <Text
      className={`self-start overflow-hidden rounded-[5px] px-[7px] py-[3px] font-medium text-[10.5px] tracking-[0.1px] ${className}`}
    >
      {children}
    </Text>
  );
}

/** Строка задачи в мобильном списке (макет Figma: task/*) */
export function TaskListItem({ task }: { task: Task }) {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const palette = themes[theme];
  const { urgency, days } = urgencyOf(task);
  const date = task.due ? formatIsoDate(task.due, 'd MMM', i18n.language).replace('.', '') : '';
  const signal = task.status !== 'done' && (task.escalationHours !== null || task.deputy !== null);
  const stripe =
    task.status === 'done'
      ? null
      : urgency === 'overdue'
        ? 'bg-brand-red'
        : signal || urgency === 'soon'
          ? 'bg-warning'
          : urgency === 'week'
            ? 'bg-info'
            : null;

  const due = !task.due ? (
    <Chip className="bg-muted-chip text-dim">{t('tasks.noDue')}</Chip>
  ) : urgency === 'overdue' ? (
    <Chip className="bg-danger-chip text-danger">{t('tasks.overdue', { count: days })}</Chip>
  ) : urgency === 'soon' ? (
    <Chip className="bg-warning-chip text-warning-text">
      {days === 0 ? `${date} · ${t('tasks.today')}` : t('tasks.inDays', { date, count: days })}
    </Chip>
  ) : urgency === 'week' ? (
    <Chip className="bg-info-chip text-info-text">{date}</Chip>
  ) : (
    <Chip className="bg-chip text-chip-text">{date}</Chip>
  );

  const meta = (Icon: ComponentType<{ size?: number; color: string }>, count?: number) => (
    <View className="flex-row items-center gap-[3px]">
      <Icon size={13} color={palette.dim} />
      {count !== undefined && <Text className="font-regular text-[10.5px] text-dim">{count}</Text>}
    </View>
  );

  return (
    <View
      accessible
      accessibilityLabel={task.title}
      className="relative bg-panel px-4 pb-[14px] pt-[10px]"
    >
      {stripe && <View className={`absolute bottom-0 left-0 top-0 w-[3px] ${stripe}`} />}
      <View className="flex-row items-center gap-[5px]">
        {task.project && (
          <>
            <View className={`size-[6px] rounded-full ${toneClasses[task.project.tone].dot}`} />
            <Text
              className="flex-1 font-medium text-[10px] tracking-[0.2px] text-faint"
              numberOfLines={1}
            >
              {task.project.name}
            </Text>
          </>
        )}
        <Text
          className={`ml-auto overflow-hidden rounded-[5px] px-[7px] py-[2px] font-medium text-[10px] ${statusChip[task.status]}`}
        >
          {t(`tasks.status.${task.status}`)}
        </Text>
      </View>
      <Text className="mt-[5px] font-medium text-[13.5px] leading-[19px] text-text">
        {task.title}
      </Text>
      <View className="mt-[9px]">{due}</View>

      {task.escalationHours !== null && task.status !== 'done' && (
        <View className="mt-[7px] flex-row items-center gap-[5px]">
          <BoltSmallIcon size={13} color={palette['warning-text']} />
          <Text className="font-medium text-[11px] text-warning-text">
            {t('tasks.escalationShort', { hours: task.escalationHours })}
          </Text>
        </View>
      )}
      {task.deputy && task.status !== 'done' && (
        <View className="mt-[7px] flex-row items-center gap-[5px]">
          <PlaneIcon size={13} color={palette.info} />
          <Text className="font-medium text-[11px] text-info">
            {t('tasks.deputyShort', { name: task.deputy.short })}
          </Text>
        </View>
      )}

      <View className="mt-[9px] flex-row items-center gap-[6px]">
        {task.assignee && (
          <View
            className={`size-5 items-center justify-center rounded-full ${toneClasses[task.assignee.tone].bg}`}
          >
            <Text className={`font-semibold text-[8.5px] ${toneClasses[task.assignee.tone].text}`}>
              {initials(task.assignee.name)}
            </Text>
          </View>
        )}
        {task.fromEmail && meta(MailSmallIcon)}
        {task.subtasks > 0 && meta(SubtasksIcon, task.subtasks)}
        {task.comments > 0 && meta(CommentIcon, task.comments)}
        {task.attachments > 0 && meta(PaperclipIcon, task.attachments)}
        {task.reschedules > 0 && task.status !== 'done' && (
          <View className="ml-auto flex-row items-center gap-[3px]">
            <RescheduleIcon size={13} color={palette['warning-text']} />
            <Text className="font-medium text-[10.5px] text-warning-text">×{task.reschedules}</Text>
          </View>
        )}
      </View>
    </View>
  );
}
