import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
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
import { z } from 'zod';
import { useSession } from '@/features/auth';
import { formatIsoDate } from '@/shared/lib/date';
import { diffDays } from '@/shared/lib/workDays';
import { PaperclipIcon, PlaneMediumIcon, PlusMediumIcon } from '@/shared/ui/icons';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import { absenceOf } from '../absences';
import { defaultDue, findSimilar, useCreateTask } from '../api';
import { dueProblem } from '../deadline';
import { projects } from '../directory';
import type { Letter } from '../mailQueue';
import {
  Avatar,
  Choices,
  DueField,
  DuplicatesNotice,
  dueMessage,
  Notice,
  NoticeText,
  staff,
  useErrorText,
  usePalette,
} from '../parts';
import type { Person } from '../types';
import { toneClasses } from '../ui';

const priorities = ['low', 'normal', 'high'] as const;

const schema = z
  .object({
    title: z.string().trim().min(3, 'errorTitle'),
    description: z.string(),
    assigneeId: z.string().min(1, 'errorAssignee'),
    due: z.string().min(1, 'errorDue'),
    projectId: z.string(),
    priority: z.enum(priorities),
  })
  .superRefine((v, ctx) => {
    if (!v.due) return;
    // Срок — не в прошлом и только рабочий день по производственному календарю КР
    const problem = dueProblem(v.due);
    if (problem) ctx.addIssue({ code: 'custom', path: ['due'], message: dueMessage(problem) });
  });

type FormValues = z.infer<typeof schema>;

const projectList = Object.values(projects);

const fieldBox = 'rounded-8 border bg-column px-[13px] font-regular text-[13.5px] text-text';

function Field({
  label,
  required = false,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string | null;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <View className="gap-[6px]">
      <Text className="font-medium text-[11px] tracking-[0.2px] text-sub">
        {label}
        {required && (
          <Text accessibilityLabel={t('newTask.required')} className="text-brand-red">
            {' '}
            *
          </Text>
        )}
      </Text>
      {children}
      {error && <Text className="font-regular text-[11.5px] text-danger">{error}</Text>}
    </View>
  );
}

/**
 * «Новая задача» на мобильном (по окну web из макета). Дубли и отпуск предупреждают,
 * но не блокируют создание. Из письма очереди — тема, текст и вложения письма подставляются.
 */
export function NewTaskScreen({ letter }: { letter?: Letter | null }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const palette = usePalette();
  const department = useSession().data?.user.department;
  const create = useCreateTask();
  const errorText = useErrorText();

  const { control, handleSubmit, watch, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: letter?.subject ?? '',
      description: letter?.body ?? '',
      assigneeId: '',
      due: defaultDue(),
      projectId: '',
      priority: 'normal',
    },
  });
  const errors = formState.errors;
  const title = watch('title');
  const due = watch('due');
  const assignee = staff.find((p) => p.id === watch('assigneeId'));
  const similar = title.trim().length >= 6 ? findSimilar(title) : [];
  const absence = absenceOf(assignee?.id);

  const onSubmit = handleSubmit(async (v) => {
    const task = await create.mutateAsync({
      title: v.title.trim(),
      description: v.description.trim(),
      assignee: staff.find((p) => p.id === v.assigneeId) as Person,
      due: v.due,
      project: projectList.find((p) => p.id === v.projectId) ?? null,
      priority: v.priority,
      attachments: letter?.attachments.length ?? 0,
      letter: letter ?? undefined,
    });
    router.replace(`/tasks/${task.id}`);
  });

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-canvas">
      <ScreenHeader fallback="/tasks" title={t('newTask.title')} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="gap-[18px] px-4 pb-6 pt-4"
        >
          {department && (
            <Text className="-mb-2 font-regular text-[12px] text-faint">{department}</Text>
          )}

          <Field label={t('newTask.name')} required error={errorText(errors.title?.message)}>
            <Controller
              control={control}
              name="title"
              render={({ field }) => (
                <TextInput
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  placeholder={t('newTask.namePlaceholder')}
                  placeholderTextColor={palette.dim}
                  accessibilityLabel={t('newTask.name')}
                  className={`${fieldBox} h-[44px] ${errors.title ? 'border-danger' : 'border-line'}`}
                />
              )}
            />
          </Field>
          {similar.length > 0 && (
            <View className="-mt-2">
              <DuplicatesNotice tasks={similar} onOpen={(id) => router.replace(`/tasks/${id}`)} />
            </View>
          )}

          <Field label={t('newTask.description')}>
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <TextInput
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  multiline
                  textAlignVertical="top"
                  placeholder={t('newTask.descriptionPlaceholder')}
                  placeholderTextColor={palette.dim}
                  accessibilityLabel={t('newTask.description')}
                  className={`${fieldBox} min-h-[88px] border-line py-3 leading-[19px]`}
                />
              )}
            />
          </Field>

          <Field
            label={t('newTask.assignee')}
            required
            error={errorText(errors.assigneeId?.message)}
          >
            <Controller
              control={control}
              name="assigneeId"
              render={({ field }) => (
                <Choices
                  label={t('newTask.assignee')}
                  value={field.value || null}
                  onChange={field.onChange}
                  invalid={!!errors.assigneeId}
                  options={staff.map((p) => ({
                    value: p.id,
                    label: p.short,
                    prefix: <Avatar person={p} size={20} />,
                  }))}
                />
              )}
            />
          </Field>
          {absence && assignee && (
            <View className="-mt-2">
              <Notice
                tone="info"
                Icon={PlaneMediumIcon}
                title={t('newTask.absenceTitle', {
                  from: formatIsoDate(absence.from, 'd', lang),
                  to: formatIsoDate(absence.to, 'd MMMM', lang),
                  name: absence.deputy.short,
                })}
              >
                {due && (
                  <NoticeText>
                    {t(
                      diffDays(due, absence.from) > 0
                        ? 'newTask.absenceBefore'
                        : 'newTask.absenceDuring',
                      { due: formatIsoDate(due, 'd MMMM', lang) },
                    )}
                  </NoticeText>
                )}
              </Notice>
            </View>
          )}

          <Field label={t('newTask.due')} required error={errorText(errors.due?.message)}>
            <Controller
              control={control}
              name="due"
              render={({ field }) => (
                <DueField
                  label={t('newTask.due')}
                  value={field.value || null}
                  onChange={field.onChange}
                  invalid={!!errors.due}
                />
              )}
            />
          </Field>

          <Field label={t('newTask.project')}>
            <Controller
              control={control}
              name="projectId"
              render={({ field }) => (
                <Choices
                  label={t('newTask.project')}
                  value={field.value || 'none'}
                  onChange={(v) => field.onChange(v === 'none' ? '' : v)}
                  options={[
                    { value: 'none', label: t('newTask.noProject') },
                    ...projectList.map((p) => ({
                      value: p.id,
                      label: p.name,
                      prefix: (
                        <View className={`size-[6px] rounded-full ${toneClasses[p.tone].dot}`} />
                      ),
                    })),
                  ]}
                />
              )}
            />
          </Field>

          <Field label={t('newTask.priority')}>
            <Controller
              control={control}
              name="priority"
              render={({ field }) => (
                <Choices
                  label={t('newTask.priority')}
                  value={field.value}
                  onChange={field.onChange}
                  options={priorities.map((p) => ({
                    value: p,
                    label: t(`taskCard.priorityValue.${p}`),
                  }))}
                />
              )}
            />
          </Field>

          {letter && letter.attachments.length > 0 && (
            <Field label={t('newTask.attachments')}>
              <View className="flex-row items-center gap-[6px]">
                <PaperclipIcon size={13} color={palette.faint} />
                <Text className="flex-1 font-regular text-[12px] text-faint" numberOfLines={2}>
                  {letter.attachments.join(', ')}
                </Text>
              </View>
            </Field>
          )}
        </ScrollView>

        <View className="gap-2 border-t border-line bg-panel px-4 pb-2 pt-3">
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: formState.isSubmitting }}
            disabled={formState.isSubmitting}
            onPress={onSubmit}
            className={`h-11 flex-row items-center justify-center gap-2 rounded-[10px] bg-brand-red active:opacity-80 ${
              formState.isSubmitting ? 'opacity-60' : ''
            }`}
          >
            <PlusMediumIcon size={17} color="#FFFFFF" />
            <Text className="font-semibold text-[13.5px] tracking-[-0.1px] text-[#FFFFFF]">
              {t('newTask.create')}
            </Text>
          </Pressable>
          <Text className="text-center font-regular text-[11px] text-dim">{t('newTask.hint')}</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
