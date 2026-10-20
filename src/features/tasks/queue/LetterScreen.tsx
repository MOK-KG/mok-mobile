import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatInBishkek, formatIsoDate } from '@/shared/lib/date';
import {
  AlertMiniIcon,
  EditMediumIcon,
  FileIcon,
  PlusMediumIcon,
  RejectIcon,
  SparkleIcon,
} from '@/shared/ui/icons';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import { findSimilar, useCreateFromLetter, useMailQueue, useRejectLetter } from '../api';
import { dueProblem } from '../deadline';
import { projects } from '../directory';
import { canCreate, type Letter, type Suggestion, type SuggestionField } from '../mailQueue';
import {
  Avatar,
  Choices,
  DueField,
  DuplicatesNotice,
  dueMessage,
  staff,
  useErrorText,
  usePalette,
} from '../parts';
import { toneClasses } from '../ui';
import { StateChip } from './QueueScreen';

const projectList = Object.values(projects);
const fields: SuggestionField[] = ['title', 'assignee', 'due', 'project', 'priority'];

/** Письмо из очереди и предложение модели: задача создаётся только после подтверждения */
export function LetterScreen({ letterId }: { letterId: string }) {
  const { t } = useTranslation();
  const queue = useMailQueue();
  const letter = queue.data?.find((l) => l.id === letterId);

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-canvas">
      <ScreenHeader fallback="/tasks" title={t('mailQueue.letter')} />
      {letter?.suggestion ? (
        <ParsedLetter key={letter.id} letter={letter} suggestion={letter.suggestion} />
      ) : (
        <Text className="py-10 text-center font-regular text-[13px] text-sub">
          {queue.isPending ? '' : t('mailQueue.empty')}
        </Text>
      )}
    </SafeAreaView>
  );
}

function ParsedLetter({ letter, suggestion }: { letter: Letter; suggestion: Suggestion }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const palette = usePalette();
  const errorText = useErrorText();
  const [draft, setDraft] = useState<Suggestion>(suggestion);
  const [editing, setEditing] = useState<SuggestionField | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const create = useCreateFromLetter();

  const problem = draft.due ? dueProblem(draft.due) : null;
  const ready = canCreate(draft) && !problem;
  const similar = findSimilar(draft.title);

  const confirmField = (field: SuggestionField) => {
    setDraft((d) => {
      const flags = { ...d.flags };
      delete flags[field];
      return { ...d, flags };
    });
    setEditing(null);
  };

  const display: Record<SuggestionField, string> = {
    title: draft.title,
    assignee: draft.assignee
      ? [draft.assignee.short, draft.assignee.unit].filter(Boolean).join(' · ')
      : '—',
    due: draft.due ? formatIsoDate(draft.due, 'd MMMM yyyy · EEEE', lang) : '—',
    project: draft.project?.name ?? t('newTask.noProject'),
    priority: t(`taskCard.priorityValue.${draft.priority}`),
  };

  const editor = (field: SuggestionField) => {
    const label = t(`mailQueue.field.${field}`);
    switch (field) {
      case 'title':
        return (
          <TextInput
            autoFocus
            value={draft.title}
            onChangeText={(title) => setDraft({ ...draft, title })}
            accessibilityLabel={t('mailQueue.edit', { field: label })}
            className="min-h-10 rounded-6 border border-info bg-panel px-2 font-regular text-[13px] text-text"
            multiline
          />
        );
      case 'assignee':
        return (
          <Choices
            label={label}
            value={draft.assignee?.id ?? null}
            onChange={(id) =>
              setDraft({ ...draft, assignee: staff.find((p) => p.id === id) ?? null })
            }
            options={staff.map((p) => ({
              value: p.id,
              label: p.short,
              prefix: <Avatar person={p} size={20} />,
            }))}
          />
        );
      case 'due':
        return (
          <DueField
            label={label}
            value={draft.due}
            onChange={(due) => setDraft({ ...draft, due })}
            invalid={!!problem}
          />
        );
      case 'project':
        return (
          <Choices
            label={label}
            value={draft.project?.id ?? 'none'}
            onChange={(id) =>
              setDraft({ ...draft, project: projectList.find((p) => p.id === id) ?? null })
            }
            options={[
              { value: 'none', label: t('newTask.noProject') },
              ...projectList.map((p) => ({
                value: p.id,
                label: p.name,
                prefix: <View className={`size-[6px] rounded-full ${toneClasses[p.tone].dot}`} />,
              })),
            ]}
          />
        );
      case 'priority':
        return (
          <Choices
            label={label}
            value={draft.priority}
            onChange={(priority) => setDraft({ ...draft, priority })}
            options={(['low', 'normal', 'high'] as const).map((p) => ({
              value: p,
              label: t(`taskCard.priorityValue.${p}`),
            }))}
          />
        );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="px-4 pb-6 pt-4">
        <Text className="font-semibold text-[17px] leading-[23px] tracking-[-0.3px] text-text">
          {letter.subject}
        </Text>
        <Text className="mt-1 font-regular text-[12px] text-faint">
          {t('mailQueue.from', { organization: letter.organization, address: letter.address })}
        </Text>
        <Text className="font-regular text-[12px] text-faint">
          {t('mailQueue.received', {
            date: formatInBishkek(letter.receivedAt, 'd MMMM yyyy, HH:mm', lang),
          })}
        </Text>
        <Text className="mt-3 rounded-9 border border-line bg-surface px-[13px] py-[11px] font-regular text-[12.5px] leading-[18px] text-sub">
          {letter.body}
        </Text>
        {letter.attachments.length > 0 && (
          <View className="mt-3 flex-row flex-wrap gap-2">
            {letter.attachments.map((a) => (
              <View
                key={a}
                className="h-7 flex-row items-center gap-[5px] rounded-[7px] border border-line bg-surface px-2"
              >
                <FileIcon size={15} color={palette.faint} />
                <Text className="font-regular text-[11px] text-sub">{a}</Text>
              </View>
            ))}
          </View>
        )}

        <View className="my-[18px] h-px bg-line" />
        <View className="flex-row items-center gap-[6px]">
          <SparkleIcon size={14} color={palette['tone-violet']} />
          <Text className="font-semibold text-[10px] uppercase tracking-[1.4px] text-tone-violet">
            {t('mailQueue.suggestion')}
          </Text>
          <View className="ml-auto">
            <StateChip ready={ready} />
          </View>
        </View>

        {similar.length > 0 && (
          <View className="mt-3">
            <DuplicatesNotice tasks={similar} />
          </View>
        )}

        <View className="mt-3 gap-[6px]">
          {fields.map((field) => {
            const flag = draft.flags[field];
            const label = t(`mailQueue.field.${field}`);
            return (
              <View
                key={field}
                className={`rounded-8 border bg-surface px-[11px] py-2 ${
                  flag === 'missing'
                    ? 'border-danger-line'
                    : flag === 'confirm'
                      ? 'border-warning-line'
                      : 'border-line'
                }`}
              >
                <View className="flex-row items-center gap-2">
                  <View className="min-w-0 flex-1">
                    <Text className="font-regular text-[10.5px] tracking-[0.2px] text-dim">
                      {label}
                    </Text>
                    {editing !== field && (
                      <Text className="font-medium text-[13px] tracking-[-0.1px] text-text">
                        {display[field]}
                      </Text>
                    )}
                  </View>
                  {flag && editing !== field && (
                    <View
                      className={`h-5 flex-row items-center gap-1 rounded-[5px] px-[6px] ${
                        flag === 'missing' ? 'bg-danger-chip' : 'bg-warning-chip'
                      }`}
                    >
                      <AlertMiniIcon
                        size={11}
                        color={flag === 'missing' ? palette.danger : palette['warning-text']}
                      />
                      <Text
                        className={`font-medium text-[10.5px] ${
                          flag === 'missing' ? 'text-danger' : 'text-warning-text'
                        }`}
                      >
                        {flag === 'missing' ? t('mailQueue.missing') : t('mailQueue.confirm')}
                      </Text>
                    </View>
                  )}
                  {editing === field ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ disabled: field === 'assignee' && !draft.assignee }}
                      disabled={field === 'assignee' && !draft.assignee}
                      onPress={() => confirmField(field)}
                      className={`h-8 justify-center rounded-6 bg-info px-3 ${
                        field === 'assignee' && !draft.assignee ? 'opacity-40' : ''
                      }`}
                    >
                      <Text className="font-semibold text-[12px] text-panel">
                        {t('mailQueue.done')}
                      </Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t('mailQueue.edit', { field: label })}
                      onPress={() => setEditing(field)}
                      hitSlop={8}
                      className="size-8 items-center justify-center rounded-6"
                    >
                      <EditMediumIcon size={16} color={palette.faint} />
                    </Pressable>
                  )}
                </View>
                {editing === field && <View className="mt-2">{editor(field)}</View>}
                {field === 'due' && problem && (
                  <Text className="mt-1 font-regular text-[11.5px] text-danger">
                    {errorText(dueMessage(problem))}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
        <Text className="mt-3 font-regular text-[11px] leading-[15px] text-dim">
          {t('mailQueue.rejectNote')}
        </Text>
      </ScrollView>

      <View className="gap-2 border-t border-line bg-panel px-4 pb-2 pt-3">
        {!ready && (
          <Text className="text-center font-regular text-[11px] text-dim">
            {t('mailQueue.notFilled')}
          </Text>
        )}
        <View className="flex-row gap-3">
          <Pressable
            accessibilityRole="button"
            onPress={() => setRejecting(true)}
            className="h-11 flex-row items-center justify-center gap-[6px] rounded-[10px] border border-line px-4"
          >
            <RejectIcon size={15} color={palette.sub} />
            <Text className="font-medium text-[13px] text-sub">{t('mailQueue.reject')}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !ready || create.isPending }}
            disabled={!ready || create.isPending}
            onPress={() =>
              create.mutate(
                { letterId: letter.id, suggestion: draft },
                { onSuccess: (task) => router.replace(`/tasks/${task.id}`) },
              )
            }
            className={`h-11 flex-1 flex-row items-center justify-center gap-2 rounded-[10px] bg-brand-red active:opacity-80 ${
              !ready || create.isPending ? 'opacity-50' : ''
            }`}
          >
            <PlusMediumIcon size={17} color="#FFFFFF" />
            <Text className="font-semibold text-[13.5px] tracking-[-0.1px] text-[#FFFFFF]">
              {t('mailQueue.create')}
            </Text>
          </Pressable>
        </View>
      </View>

      <RejectDialog open={rejecting} letterId={letter.id} onClose={() => setRejecting(false)} />
    </KeyboardAvoidingView>
  );
}

/** Отклонение письма: причина обязательна, она и автор попадают в журнал */
function RejectDialog({
  open,
  letterId,
  onClose,
}: {
  open: boolean;
  letterId: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const palette = usePalette();
  const reject = useRejectLetter();
  const [reason, setReason] = useState('');
  const [error, setError] = useState(false);

  const submit = () => {
    if (reason.trim().length < 5) {
      setError(true);
      return;
    }
    reject.mutate(
      { letterId, reason },
      {
        onSuccess: () => {
          onClose();
          // Письмо ушло из очереди — вернуться к ней (или открыть её, если письмо открыто по ссылке)
          if (router.canGoBack()) router.back();
          else router.replace('/tasks/queue');
        },
      },
    );
  };

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View className="flex-1 justify-center bg-[rgba(3,6,12,0.6)] px-4">
          <View accessibilityViewIsModal className="rounded-18 border border-line bg-panel p-5">
            <Text accessibilityRole="header" className="font-semibold text-[16px] text-text">
              {t('mailQueue.rejectTitle')}
            </Text>
            <Text className="mt-4 font-medium text-[11px] tracking-[0.2px] text-sub">
              {t('mailQueue.rejectReason')}
              <Text className="text-brand-red"> *</Text>
            </Text>
            <TextInput
              autoFocus
              multiline
              textAlignVertical="top"
              value={reason}
              onChangeText={(text) => {
                setReason(text);
                setError(false);
              }}
              placeholder={t('mailQueue.rejectPlaceholder')}
              placeholderTextColor={palette.dim}
              accessibilityLabel={t('mailQueue.rejectReason')}
              className={`mt-[6px] min-h-[84px] rounded-8 border bg-column px-3 py-2 font-regular text-[13px] text-text ${
                error ? 'border-danger' : 'border-line'
              }`}
            />
            {error && (
              <Text className="mt-1 font-regular text-[11.5px] text-danger">
                {t('mailQueue.rejectError')}
              </Text>
            )}
            <Text className="mt-2 font-regular text-[11px] leading-[15px] text-dim">
              {t('mailQueue.rejectNote')}
            </Text>
            <View className="mt-4 flex-row justify-end gap-2">
              <Pressable
                accessibilityRole="button"
                onPress={onClose}
                className="h-10 justify-center rounded-9 border border-line px-4"
              >
                <Text className="font-medium text-[13px] text-sub">
                  {t('mailQueue.rejectCancel')}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={submit}
                className="h-10 justify-center rounded-9 bg-brand-red px-4 active:opacity-80"
              >
                <Text className="font-semibold text-[13px] text-[#FFFFFF]">
                  {t('mailQueue.rejectConfirm')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
