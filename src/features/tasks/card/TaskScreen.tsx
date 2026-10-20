import { router } from 'expo-router';
import { type ComponentType, type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCan } from '@/features/auth';
import { formatInBishkek, formatIsoDate } from '@/shared/lib/date';
import { addDays, todayInBishkek } from '@/shared/lib/workDays';
import {
  BellSmallIcon,
  BoltMediumIcon,
  BookIcon,
  CheckTinyIcon,
  ExternalIcon,
  HistoryBoltIcon,
  HistoryClockIcon,
  HistoryMailIcon,
  HistorySwapIcon,
  MailMediumIcon,
  MovesIcon,
  PlaneMediumIcon,
  PlusSmallIcon,
  SendIcon,
} from '@/shared/ui/icons';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import { absenceOf, isAbsentOn } from '../absences';
import { useAddComment, useAddSubtask, useTask, useToggleSubtask } from '../api';
import { urgencyOf } from '../deadline';
import { Avatar, Notice, NoticeText, sectionTitle, statusChip, usePalette } from '../parts';
import type { HistoryEntry, HistoryKind, TaskDetail } from '../types';
import { toneClasses } from '../ui';

const shortDate = (d: string, lang: string) => formatIsoDate(d, 'd MMM', lang).replace('.', '');

const chip = 'overflow-hidden rounded-6 px-[9px] py-[5px] font-medium text-[11px] tracking-[0.1px]';

/** Карточка задачи на мобильном (по макету web «Карточка тикета»: одна колонка) */
export function TaskScreen({ taskId }: { taskId: string }) {
  const { t } = useTranslation();
  const task = useTask(taskId);

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-canvas">
      <ScreenHeader
        fallback="/tasks"
        right={
          task.data && (
            <Text className="pr-1 font-medium text-[11px] tracking-[0.3px] text-dim">
              {task.data.code}
            </Text>
          )
        }
      />
      {task.data ? (
        <TaskBody task={task.data} />
      ) : (
        <Text className="py-10 text-center font-regular text-[13px] text-sub">
          {task.isPending ? '' : t('taskCard.notFound')}
        </Text>
      )}
    </SafeAreaView>
  );
}

function TaskBody({ task }: { task: TaskDetail }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const palette = usePalette();
  const { urgency } = urgencyOf(task);
  const dueChip = {
    overdue: 'bg-danger-chip text-danger',
    soon: 'bg-warning-chip text-warning-text',
    week: 'bg-info-chip text-info-text',
    later: 'bg-chip text-chip-text',
    none: 'bg-muted-chip text-dim',
  }[urgency];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-[18px] px-4 pb-6 pt-4"
      >
        {task.escalatedAt && task.status !== 'done' && (
          <Notice
            tone="warning"
            stripe
            Icon={BoltMediumIcon}
            title={t('taskCard.escalationTitle', { hours: task.escalationHours })}
          >
            <NoticeText>
              {t('taskCard.escalationText', {
                date: formatInBishkek(task.escalatedAt, 'd MMMM', lang),
                time: formatInBishkek(task.escalatedAt, 'HH:mm', lang),
              })}
            </NoticeText>
          </Notice>
        )}

        <View>
          {task.project && (
            <View className="mb-2 flex-row items-center gap-[6px]">
              <View className={`size-[7px] rounded-full ${toneClasses[task.project.tone].dot}`} />
              <Text className="font-medium text-[11px] tracking-[0.2px] text-faint">
                {task.project.name}
              </Text>
            </View>
          )}
          <Text
            accessibilityRole="header"
            className="font-semibold text-[21px] leading-[27px] tracking-[-0.4px] text-text"
          >
            {task.title}
          </Text>
          <View className="mt-[9px] flex-row flex-wrap gap-[7px]">
            <Text className={`${chip} ${statusChip[task.status]}`}>
              {t(`tasks.status.${task.status}`)}
            </Text>
            <Text className={`${chip} ${dueChip}`}>
              {task.due
                ? t('taskCard.dueChip', { date: shortDate(task.due, lang) })
                : t('taskCard.noDue')}
            </Text>
            {task.priority !== 'normal' && (
              <Text
                className={`${chip} ${
                  task.priority === 'high' ? 'bg-danger-chip text-danger' : 'bg-chip text-chip-text'
                }`}
              >
                {t(`taskCard.priorityChip.${task.priority}`)}
              </Text>
            )}
          </View>
        </View>

        <View>
          <Text className={sectionTitle}>{t('taskCard.description')}</Text>
          <Text className="mt-2 font-regular text-[13px] leading-5 text-sub">
            {task.description || t('taskCard.noDescription')}
          </Text>
          {task.knowledgeLink && (
            <Pressable
              accessibilityRole="link"
              onPress={() => router.push('/knowledge')}
              className="mt-3 h-[40px] flex-row items-center gap-[9px] rounded-9 border border-line bg-surface px-[13px] active:opacity-80"
            >
              <BookIcon size={17} color={palette.info} />
              <Text numberOfLines={1} className="flex-1 font-medium text-[12.5px] text-info">
                {t('taskCard.knowledge', { title: task.knowledgeLink })}
              </Text>
              <ExternalIcon size={15} color={palette.faint} />
            </Pressable>
          )}
        </View>

        <Properties task={task} />
        <Subtasks task={task} />
        <Discussion task={task} />
        <History task={task} />
      </ScrollView>
      <CommentInput taskId={task.id} />
    </KeyboardAvoidingView>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="min-h-[34px] flex-row items-center gap-2 border-b border-line py-[6px] last:border-b-0">
      <Text className="w-[120px] font-regular text-[12px] text-faint">{label}</Text>
      <View className="min-w-0 flex-1 flex-row items-center gap-[6px]">{children}</View>
    </View>
  );
}

const value = 'shrink font-medium text-[12.5px] tracking-[-0.1px] text-text';

function Properties({ task }: { task: TaskDetail }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const palette = usePalette();
  const absence = absenceOf(task.assignee?.id);
  const absentNow = absence !== null && isAbsentOn(absence, todayInBishkek());

  return (
    <View className="gap-[10px]">
      <Text className={sectionTitle}>{t('taskCard.properties')}</Text>
      <View className="rounded-12 border border-line bg-column px-3">
        <Row label={t('taskCard.assignee')}>
          {task.assignee ? (
            <>
              <Avatar person={task.assignee} size={22} />
              <Text className={value}>{task.assignee.short}</Text>
            </>
          ) : (
            <Text className={value}>—</Text>
          )}
        </Row>
        <Row label={t('taskCard.author')}>
          <Text className={value}>{task.author.short}</Text>
        </Row>
        <Row label={t('taskCard.department')}>
          <Text className={value}>{task.department}</Text>
        </Row>
        <Row label={t('taskCard.project')}>
          {task.project && (
            <View className={`size-[6px] rounded-full ${toneClasses[task.project.tone].dot}`} />
          )}
          <Text className={value}>{task.project?.name ?? t('newTask.noProject')}</Text>
        </Row>
        <Row label={t('taskCard.priority')}>
          <Text className={`${value} ${task.priority === 'high' ? 'text-danger' : ''}`}>
            {t(`taskCard.priorityValue.${task.priority}`)}
          </Text>
        </Row>
        <Row label={t('taskCard.due')}>
          <Text className={value}>
            {task.due ? formatIsoDate(task.due, 'd MMMM · EEEE', lang) : t('taskCard.noDue')}
          </Text>
        </Row>
        <Row label={t('taskCard.source')}>
          {task.source.kind === 'email' ? (
            <View>
              <View className="flex-row items-center gap-[5px]">
                <MailMediumIcon size={14} color={palette['warning-text']} />
                <Text className="font-medium text-[12px] text-warning-text">
                  {t('taskCard.sourceEmail')}
                </Text>
              </View>
              <Text className="font-regular text-[11px] text-dim">
                {task.source.mailbox} · {formatInBishkek(task.source.at, 'd MMMM', lang)}
              </Text>
            </View>
          ) : (
            <Text className={value}>{t('taskCard.sourceManual')}</Text>
          )}
        </Row>
      </View>

      {absence && absentNow && (
        <Notice
          tone="info"
          Icon={PlaneMediumIcon}
          title={t('taskCard.absenceTitle', { date: formatIsoDate(absence.to, 'd MMMM', lang) })}
        >
          <NoticeText>{t('taskCard.absenceText', { name: absence.deputy.short })}</NoticeText>
        </Notice>
      )}
      {task.rescheduleLog.length > 0 && (
        <Notice
          tone="warning"
          Icon={MovesIcon}
          title={t('taskCard.moves', { count: task.rescheduleLog.length })}
        >
          {task.rescheduleLog.map((r) => (
            <NoticeText key={`${r.from}-${r.to}`}>
              {shortDate(r.from, lang)} → {shortDate(r.to, lang)} · {r.by.short}
            </NoticeText>
          ))}
        </Notice>
      )}
      {task.reminderDays !== null && task.due && (
        <Notice
          tone="neutral"
          Icon={BellSmallIcon}
          title={t('taskCard.reminder', { count: task.reminderDays })}
        >
          <NoticeText>
            {t('taskCard.reminderText', {
              date: formatIsoDate(addDays(task.due, -task.reminderDays), 'd MMMM', lang),
            })}
          </NoticeText>
        </Notice>
      )}
    </View>
  );
}

function Subtasks({ task }: { task: TaskDetail }) {
  const { t } = useTranslation();
  const palette = usePalette();
  const { can } = useCan();
  const toggle = useToggleSubtask();
  const add = useAddSubtask();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const editable = can('tasks.edit');
  const done = task.subtaskItems.filter((s) => s.done).length;

  const submit = () => {
    if (title.trim().length < 2) return;
    add.mutate({ taskId: task.id, title: title.trim() });
    setTitle('');
    setAdding(false);
  };

  return (
    <View>
      <View className="flex-row items-baseline gap-[14px]">
        <Text className={sectionTitle}>{t('taskCard.subtasks')}</Text>
        {task.subtaskItems.length > 0 && (
          <Text className="font-medium text-[11px] tracking-[0.2px] text-faint">
            {t('tasks.shownOf', { shown: done, total: task.subtaskItems.length })}
          </Text>
        )}
      </View>
      <View className="mt-1">
        {task.subtaskItems.map((s) => (
          <Pressable
            key={s.id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: s.done, disabled: !editable }}
            disabled={!editable}
            onPress={() => toggle.mutate({ taskId: task.id, subtaskId: s.id })}
            className="min-h-[38px] flex-row items-center gap-[10px] py-1"
          >
            <View
              className={`size-5 items-center justify-center rounded-[5px] ${
                s.done ? 'bg-success' : 'border-[1.4px] border-dim'
              }`}
            >
              {s.done && <CheckTinyIcon size={12} color={palette.panel} />}
            </View>
            <Text
              className={`flex-1 font-regular text-[13px] tracking-[-0.1px] ${
                s.done ? 'text-faint line-through' : 'text-text'
              }`}
            >
              {s.title}
            </Text>
            {s.assignee && <Avatar person={s.assignee} size={20} />}
          </Pressable>
        ))}
      </View>
      {editable &&
        (adding ? (
          <TextInput
            autoFocus
            value={title}
            onChangeText={setTitle}
            onSubmitEditing={submit}
            onBlur={() => !title && setAdding(false)}
            returnKeyType="done"
            placeholder={t('taskCard.newSubtask')}
            placeholderTextColor={palette.dim}
            accessibilityLabel={t('taskCard.newSubtask')}
            className="mt-1 h-10 rounded-8 border border-info bg-column px-3 font-regular text-[13px] text-text"
          />
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={() => setAdding(true)}
            className="mt-1 h-9 flex-row items-center gap-[6px] self-start"
          >
            <PlusSmallIcon size={14} color={palette.dim} />
            <Text className="font-regular text-[12.5px] text-dim">{t('taskCard.addSubtask')}</Text>
          </Pressable>
        ))}
    </View>
  );
}

const VISIBLE_COMMENTS = 2;

function Discussion({ task }: { task: TaskDetail }) {
  const { t, i18n } = useTranslation();
  const [all, setAll] = useState(false);
  const hidden = all ? 0 : Math.max(0, task.commentItems.length - VISIBLE_COMMENTS);
  const visible = task.commentItems.slice(hidden);

  return (
    <View>
      <View className="flex-row items-baseline gap-[14px]">
        <Text className={sectionTitle}>{t('taskCard.discussion')}</Text>
        <Text className="font-medium text-[11px] tracking-[0.2px] text-faint">
          {task.commentItems.length}
        </Text>
      </View>
      {hidden > 0 && (
        <Pressable
          accessibilityRole="button"
          onPress={() => setAll(true)}
          className="mt-2 self-start"
        >
          <Text className="font-medium text-[12px] text-info">
            {t('taskCard.showMoreComments', { count: hidden })}
          </Text>
        </Pressable>
      )}
      <View className="mt-3 gap-3">
        {visible.map((c) => (
          <View key={c.id} className="flex-row gap-[10px]">
            <Avatar person={c.author} size={26} />
            <View className="min-w-0 flex-1">
              <View className="flex-row items-baseline gap-2">
                <Text className="font-medium text-[12.5px] tracking-[-0.1px] text-text">
                  {c.author.short}
                </Text>
                <Text className="font-regular text-[11px] text-dim">
                  {formatInBishkek(c.at, 'd MMM, HH:mm', i18n.language)}
                </Text>
              </View>
              <Text className="mt-[2px] font-regular text-[13px] leading-[19px] text-sub">
                {c.text}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Поле комментария прижато к низу экрана и поднимается вместе с клавиатурой */
function CommentInput({ taskId }: { taskId: string }) {
  const { t } = useTranslation();
  const palette = usePalette();
  const add = useAddComment();
  const [text, setText] = useState('');

  const submit = () => {
    if (!text.trim()) return;
    add.mutate({ taskId, text: text.trim() });
    setText('');
  };

  return (
    <View className="border-t border-line bg-panel px-4 py-[10px]">
      <View className="min-h-10 flex-row items-center gap-1 rounded-9 border border-line bg-surface pl-[13px] pr-[6px]">
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={submit}
          returnKeyType="send"
          placeholder={t('taskCard.writeComment')}
          placeholderTextColor={palette.dim}
          accessibilityLabel={t('taskCard.writeComment')}
          className="min-h-10 flex-1 font-regular text-[13px] text-text"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('taskCard.send')}
          accessibilityState={{ disabled: !text.trim() }}
          disabled={!text.trim()}
          onPress={submit}
          hitSlop={6}
          className={`size-8 items-center justify-center rounded-6 ${text.trim() ? '' : 'opacity-40'}`}
        >
          <SendIcon size={17} color={palette.info} />
        </Pressable>
      </View>
    </View>
  );
}

const historyIcons: Record<HistoryKind, ComponentType<{ size?: number; color: string }>> = {
  escalation: HistoryBoltIcon,
  assignee: HistorySwapIcon,
  due: HistoryClockIcon,
  created: HistoryMailIcon,
  status: HistorySwapIcon,
  subtask: CheckTinyIcon,
  comment: HistoryMailIcon,
};

function historyText(
  entry: HistoryEntry,
  t: (k: string, o?: Record<string, unknown>) => string,
  lang: string,
) {
  switch (entry.kind) {
    case 'escalation':
      return t('taskCard.historyEscalation');
    case 'due': {
      const [from, to] = entry.text.split('|');
      return t('taskCard.historyDue', { from: shortDate(from, lang), to: shortDate(to, lang) });
    }
    case 'created':
      return entry.text === 'email'
        ? t('taskCard.historyCreatedEmail')
        : t('taskCard.historyCreatedManual');
    case 'subtask': {
      const [action, title] = entry.text.split('|');
      const key = {
        done: 'historySubtaskDone',
        undone: 'historySubtaskUndone',
        added: 'historySubtaskAdded',
      }[action];
      return t(`taskCard.${key}`, { title });
    }
    default:
      return entry.text;
  }
}

function History({ task }: { task: TaskDetail }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const palette = usePalette();
  const color: Partial<Record<HistoryKind, string>> = {
    escalation: palette['warning-text'],
    assignee: palette.info,
    created: palette['tone-gold'],
    subtask: palette.success,
  };

  return (
    <View>
      <Text className={sectionTitle}>{t('taskCard.history')}</Text>
      <View className="mt-2">
        {task.history.map((h) => {
          const Icon = historyIcons[h.kind];
          return (
            <View key={h.id} className="flex-row gap-2 border-b border-line py-2 last:border-b-0">
              <View className="mt-px">
                <Icon size={13} color={color[h.kind] ?? palette.faint} />
              </View>
              <View className="flex-1">
                <Text className="font-regular text-[12px] leading-4 text-sub">
                  {historyText(h, t, lang)}
                </Text>
                <Text className="font-regular text-[10.5px] text-dim">
                  {formatInBishkek(h.at, 'd MMM HH:mm', lang)}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
      <Text className="mt-4 font-regular text-[11px] leading-[15px] text-dim">
        {t('taskCard.journalNote')}
      </Text>
    </View>
  );
}
