import { zodResolver } from '@hookform/resolvers/zod';
import { router, useNavigation } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { type ReactNode, useRef, useState } from 'react';
import { type Control, Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  Alert,
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
import { useTheme } from '@/app/providers/ThemeProvider';
import { ForbiddenScreen } from '@/features/auth';
import { useTasks } from '@/features/tasks/api';
import { statusChip } from '@/features/tasks/parts';
import { ApiError } from '@/shared/api/errors';
import { themes } from '@/shared/config/tokens';
import {
  AttachLargeIcon,
  CheckIcon,
  ChevronDownIcon,
  DocSmallIcon,
  PlusSmallIcon,
  TasksSmallIcon,
  XIcon,
} from '@/shared/ui/icons';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import { Tooltip } from '@/shared/ui/Tooltip';
import {
  type ArticleDraft,
  useArticle,
  useKnowledge,
  useLinkableDocuments,
  useSaveArticle,
} from './api';
import { LinkPicker } from './LinkPicker';
import { capsTitle } from './parts';
import { SectionSheet } from './SectionSheet';
import type {
  KbArticle,
  KbAttachment,
  KbBlock,
  KbRelatedDocument,
  KbRelatedTask,
  KbSection,
} from './types';

const blockKinds = ['paragraph', 'heading', 'list', 'note'] as const;
type BlockKind = (typeof blockKinds)[number];

/** Блок в форме: одна плоская запись на все виды; список — пункты с новой строки */
type BlockField = { kind: BlockKind; anchor: string; text: string; title: string };

const SUMMARY_MAX = 200;

/** Значение пункта «Новый раздел» в выборе раздела — не ID раздела */
const NEW_SECTION = '__new__';

const lines = (text: string) =>
  text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

const blockSchema = z
  .object({
    kind: z.enum(blockKinds),
    anchor: z.string(),
    text: z.string(),
    title: z.string(),
  })
  .superRefine((b, ctx) => {
    const empty =
      b.kind === 'list'
        ? lines(b.text).length === 0
        : b.kind === 'note'
          ? !b.title.trim() || !b.text.trim()
          : !b.text.trim();
    if (empty) ctx.addIssue({ code: 'custom', path: ['text'], message: 'errorBlock' });
  });

/** Те же правила, что в web (ArticleEditor) */
const schemaFor = (editing: boolean) =>
  z.object({
    sectionId: z.string().min(1, 'errorSection'),
    title: z.string().trim().min(3, 'errorTitle'),
    summary: z.string().trim().min(10, 'errorSummary').max(SUMMARY_MAX, 'errorSummary'),
    blocks: z.array(blockSchema).min(1, 'errorBody'),
    // Вложения и связи не проверяются, а передаются как есть — со всеми полями типа
    attachments: z.array(z.custom<KbAttachment>()),
    relatedTasks: z.array(z.custom<KbRelatedTask>()),
    relatedDocuments: z.array(z.custom<KbRelatedDocument>()),
    // Для новой статьи строка истории — «первая редакция», при правке её пишет автор
    change: editing ? z.string().trim().min(3, 'errorChange') : z.string(),
  });

type FormValues = z.infer<ReturnType<typeof schemaFor>>;

const toField = (b: KbBlock): BlockField => {
  switch (b.kind) {
    case 'heading':
      return { kind: b.kind, anchor: b.id, text: b.text, title: '' };
    case 'list':
      return { kind: b.kind, anchor: '', text: b.items.join('\n'), title: '' };
    case 'note':
      return { kind: b.kind, anchor: '', text: b.text, title: b.title };
    default:
      return { kind: b.kind, anchor: '', text: b.text, title: '' };
  }
};

/** Поля формы → блоки статьи. Якорь заголовка сохраняется: на него ведут ссылки содержания */
function toBlocks(fields: BlockField[]): KbBlock[] {
  const used = new Set(fields.map((f) => f.anchor).filter(Boolean));
  let n = 0;
  const nextAnchor = () => {
    do n += 1;
    while (used.has(`h-${n}`));
    used.add(`h-${n}`);
    return `h-${n}`;
  };
  return fields.map((f): KbBlock => {
    switch (f.kind) {
      case 'heading':
        return { kind: 'heading', id: f.anchor || nextAnchor(), text: f.text.trim() };
      case 'list':
        return { kind: 'list', items: lines(f.text) };
      case 'note':
        return { kind: 'note', title: f.title.trim(), text: f.text.trim() };
      default:
        return { kind: 'paragraph', text: f.text.trim() };
    }
  });
}

const emptyBlock = (kind: BlockKind): BlockField => ({ kind, anchor: '', text: '', title: '' });

const sameDocument = (a: KbRelatedDocument, b: KbRelatedDocument) =>
  a.number === b.number && a.title === b.title;

const usePalette = () => themes[useTheme().theme];

/**
 * Редактор статьи на мобильном (макета нет — по web ArticleEditor и форме «Новая задача»):
 * /knowledge/new?section=ID и /knowledge/ID/edit, право knowledge.edit проверяет маршрут.
 */
export function ArticleEditorScreen({
  articleId,
  sectionId,
}: {
  /** undefined — новая статья */
  articleId?: string;
  /** Раздел новой статьи по умолчанию */
  sectionId?: string;
}) {
  const { t } = useTranslation();
  const editing = articleId !== undefined;
  const article = useArticle(articleId ?? '', { enabled: editing });
  const list = useKnowledge();

  if (article.error instanceof ApiError && article.error.status === 403) return <ForbiddenScreen />;

  const title = editing ? t('knowledge.editTitle') : t('knowledge.newArticle');
  const fallback = articleId ? (`/knowledge/${articleId}` as const) : ('/knowledge' as const);
  const failed = (editing && article.isError) || list.isError;

  if (failed || !list.data || (editing && !article.data)) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
        <ScreenHeader title={title} fallback={fallback} />
        {failed && (
          <Text className="px-6 py-10 text-center font-regular text-[13px] text-sub">
            {article.error instanceof ApiError && article.error.status === 404
              ? t('knowledge.notFoundTitle')
              : t('knowledge.loadError')}
          </Text>
        )}
      </SafeAreaView>
    );
  }
  return (
    <EditorForm
      article={article.data ?? null}
      sections={list.data.sections}
      initialSection={sectionId}
    />
  );
}

const fieldBox = 'rounded-8 border bg-column px-[13px] font-regular text-[13.5px] text-text';

function Field({
  label,
  required = false,
  error,
  right,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string | null;
  right?: ReactNode;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <View className="gap-[6px]">
      <View className="flex-row items-baseline justify-between gap-2">
        <Text className="font-medium text-[11px] tracking-[0.2px] text-sub">
          {label}
          {required && (
            <Text accessibilityLabel={t('newTask.required')} className="text-brand-red">
              {' '}
              *
            </Text>
          )}
        </Text>
        {right}
      </View>
      {children}
      {error && <Text className="font-regular text-[11.5px] text-danger">{error}</Text>}
    </View>
  );
}

function EditorForm({
  article,
  sections,
  initialSection,
}: {
  article: KbArticle | null;
  sections: KbSection[];
  initialSection?: string;
}) {
  const { t } = useTranslation();
  const palette = usePalette();
  const navigation = useNavigation();
  const save = useSaveArticle(article?.id ?? null);
  const [sectionSheet, setSectionSheet] = useState(false);
  // Созданный раздел виден в списке сразу, не дожидаясь перезагрузки разделов
  const [created, setCreated] = useState<KbSection[]>([]);
  const open = [
    ...sections.filter((s) => s.accessible),
    ...created.filter((c) => !sections.some((s) => s.id === c.id)),
  ];
  const editing = article !== null;

  const {
    control,
    setValue,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schemaFor(editing)),
    defaultValues: article
      ? {
          sectionId: article.sectionId,
          title: article.title,
          summary: article.summary,
          blocks: article.body.map(toField),
          attachments: article.attachments,
          relatedTasks: article.relatedTasks,
          relatedDocuments: article.relatedDocuments,
          change: '',
        }
      : {
          sectionId: open.find((s) => s.id === initialSection)?.id ?? '',
          title: '',
          summary: '',
          blocks: [emptyBlock('paragraph')],
          attachments: [],
          relatedTasks: [],
          relatedDocuments: [],
          change: '',
        },
  });
  const blocks = useFieldArray({ control, name: 'blocks' });
  const summary = useWatch({ control, name: 'summary' });
  const attachments = useWatch({ control, name: 'attachments' });
  const relatedTasks = useWatch({ control, name: 'relatedTasks' });
  const relatedDocuments = useWatch({ control, name: 'relatedDocuments' });
  const summaryLength = summary.trim().length;

  // Несохранённые правки: спросить перед уходом («назад», жест, кнопка Android)
  const saved = useRef(false);
  usePreventRemove(isDirty, ({ data }) => {
    if (saved.current) {
      navigation.dispatch(data.action);
      return;
    }
    Alert.alert(t('knowledge.leaveConfirm'), undefined, [
      { text: t('knowledge.cancel'), style: 'cancel' },
      {
        text: t('knowledge.leave'),
        style: 'destructive',
        onPress: () => navigation.dispatch(data.action),
      },
    ]);
  });

  const errorText = (key?: string) => (key ? t(`knowledge.${key}`) : null);

  const submit = handleSubmit(async (v) => {
    const draft: ArticleDraft = {
      sectionId: v.sectionId,
      title: v.title,
      summary: v.summary,
      body: toBlocks(v.blocks),
      attachments: v.attachments,
      relatedTasks: v.relatedTasks,
      relatedDocuments: v.relatedDocuments,
      change: editing ? v.change : t('knowledge.firstVersion'),
    };
    const result = await save.mutateAsync(draft).catch(() => null);
    if (!result) return;
    saved.current = true;
    // Правка открыта из статьи — вернуться к ней; новая статья заменяет редактор
    if (editing && router.canGoBack()) router.back();
    else router.replace(`/knowledge/${result.id}`);
  });

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-canvas">
      <ScreenHeader
        title={editing ? t('knowledge.editTitle') : t('knowledge.newArticle')}
        fallback={article ? `/knowledge/${article.id}` : '/knowledge'}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="gap-[18px] px-4 pb-6 pt-4"
        >
          <Field
            label={t('knowledge.titleLabel')}
            required
            error={errorText(errors.title?.message)}
          >
            <Controller
              control={control}
              name="title"
              render={({ field }) => (
                <TextInput
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  multiline
                  placeholder={t('knowledge.titlePlaceholder')}
                  placeholderTextColor={palette.dim}
                  accessibilityLabel={t('knowledge.titleLabel')}
                  className={`${fieldBox} min-h-[44px] py-[10px] font-semibold text-[16px] leading-[22px] ${
                    errors.title ? 'border-danger' : 'border-line'
                  }`}
                />
              )}
            />
          </Field>

          <Field
            label={t('knowledge.section')}
            required
            error={errorText(errors.sectionId?.message)}
          >
            <Controller
              control={control}
              name="sectionId"
              render={({ field }) => (
                <SectionChoices
                  sections={open}
                  value={field.value}
                  invalid={!!errors.sectionId}
                  onChange={field.onChange}
                  onNew={() => setSectionSheet(true)}
                />
              )}
            />
          </Field>

          <Field
            label={t('knowledge.summary')}
            required
            error={errorText(errors.summary?.message)}
            right={
              <Text
                className={`font-regular text-[11px] ${
                  summaryLength > SUMMARY_MAX ? 'text-danger' : 'text-dim'
                }`}
              >
                {summaryLength} / {SUMMARY_MAX}
              </Text>
            }
          >
            <Controller
              control={control}
              name="summary"
              render={({ field }) => (
                <TextInput
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  multiline
                  textAlignVertical="top"
                  placeholder={t('knowledge.summaryHint')}
                  placeholderTextColor={palette.dim}
                  accessibilityLabel={t('knowledge.summary')}
                  accessibilityHint={`${summaryLength} / ${SUMMARY_MAX}`}
                  className={`${fieldBox} min-h-[66px] py-[10px] leading-[19px] ${
                    errors.summary ? 'border-danger' : 'border-line'
                  }`}
                />
              )}
            />
          </Field>

          <View className="h-px bg-line" />
          <View>
            <Text accessibilityRole="header" className={capsTitle}>
              {t('knowledge.body')}
            </Text>
            <View className="mt-3 gap-3">
              {blocks.fields.map((field, i) => (
                <BlockEditor
                  key={field.id}
                  index={i}
                  kind={field.kind}
                  count={blocks.fields.length}
                  control={control}
                  invalid={!!errors.blocks?.[i]}
                  onMove={(to) => blocks.move(i, to)}
                  onRemove={() => blocks.remove(i)}
                />
              ))}
            </View>
            {(errors.blocks?.root?.message ?? errors.blocks?.message) && (
              <Text className="mt-2 font-regular text-[11.5px] text-danger">
                {errorText(errors.blocks?.root?.message ?? errors.blocks?.message)}
              </Text>
            )}
            <Text className="mt-3 font-regular text-[11.5px] text-faint">
              {t('knowledge.addBlock')}
            </Text>
            <View className="mt-2 flex-row flex-wrap gap-2">
              {blockKinds.map((kind) => (
                <Pressable
                  key={kind}
                  accessibilityRole="button"
                  accessibilityLabel={`${t('knowledge.addBlock')} ${t(`knowledge.block.${kind}`)}`}
                  onPress={() => blocks.append(emptyBlock(kind))}
                  className="h-9 flex-row items-center gap-1 rounded-8 border border-line bg-column px-[10px] active:opacity-80"
                >
                  <PlusSmallIcon size={12} color={palette.sub} />
                  <Text className="font-medium text-[12px] text-sub">
                    {t(`knowledge.block.${kind}`)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {attachments.length > 0 && (
            <>
              <View className="h-px bg-line" />
              <Attachments
                value={attachments}
                onChange={(next) => setValue('attachments', next, { shouldDirty: true })}
              />
            </>
          )}

          <View className="h-px bg-line" />
          <RelatedTasksField
            value={relatedTasks}
            onChange={(next) => setValue('relatedTasks', next, { shouldDirty: true })}
          />
          <RelatedDocumentsField
            value={relatedDocuments}
            onChange={(next) => setValue('relatedDocuments', next, { shouldDirty: true })}
          />

          {editing && (
            <>
              <View className="h-px bg-line" />
              <Field
                label={t('knowledge.change')}
                required
                error={errorText(errors.change?.message)}
              >
                <Controller
                  control={control}
                  name="change"
                  render={({ field }) => (
                    <TextInput
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      placeholder={t('knowledge.changePlaceholder')}
                      placeholderTextColor={palette.dim}
                      accessibilityLabel={t('knowledge.change')}
                      accessibilityHint={t('knowledge.changeHint')}
                      className={`${fieldBox} h-[44px] ${
                        errors.change ? 'border-danger' : 'border-line'
                      }`}
                    />
                  )}
                />
              </Field>
            </>
          )}
        </ScrollView>

        <View className="gap-2 border-t border-line bg-panel px-4 pb-2 pt-3">
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: isSubmitting }}
            disabled={isSubmitting}
            onPress={submit}
            className={`h-11 flex-row items-center justify-center gap-2 rounded-[10px] bg-brand-red active:opacity-80 ${
              isSubmitting ? 'opacity-60' : ''
            }`}
          >
            <CheckIcon size={16} color="#FFFFFF" />
            <Text className="font-semibold text-[13.5px] tracking-[-0.1px] text-[#FFFFFF]">
              {editing ? t('knowledge.save') : t('knowledge.publish')}
            </Text>
          </Pressable>
          <Text className="text-center font-regular text-[11px] text-dim">
            {t('knowledge.versionNext', { number: (article?.version ?? 0) + 1 })} ·{' '}
            {editing ? t('knowledge.changeHint') : t('knowledge.firstVersionHint')}
          </Text>
        </View>
      </KeyboardAvoidingView>

      <SectionSheet
        open={sectionSheet}
        onClose={() => setSectionSheet(false)}
        onCreated={(s) => {
          setCreated((c) => [...c, s]);
          setValue('sectionId', s.id, { shouldDirty: true, shouldValidate: true });
        }}
      />
    </SafeAreaView>
  );
}

/** Выбор раздела чипами, как в «Новой задаче»; первый пункт — «+ Новый раздел» */
function SectionChoices({
  sections,
  value,
  invalid,
  onChange,
  onNew,
}: {
  sections: KbSection[];
  value: string;
  invalid: boolean;
  onChange: (id: string) => void;
  onNew: () => void;
}) {
  const { t } = useTranslation();
  const palette = usePalette();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={t('knowledge.section')}
      className="flex-row flex-wrap gap-2"
    >
      <Pressable
        key={NEW_SECTION}
        accessibilityRole="button"
        onPress={onNew}
        className="h-9 flex-row items-center gap-[6px] rounded-8 border border-dashed border-info-line bg-column px-[10px] active:opacity-80"
      >
        <PlusSmallIcon size={12} color={palette.info} />
        <Text className="font-medium text-[12.5px] text-info">{t('knowledge.newSection')}</Text>
      </Pressable>
      {sections.map((s) => {
        const active = s.id === value;
        return (
          <Pressable
            key={s.id}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            onPress={() => onChange(s.id)}
            className={`h-9 flex-row items-center gap-[6px] rounded-8 border px-[10px] ${
              active
                ? 'border-info bg-popover-active'
                : invalid
                  ? 'border-danger bg-column'
                  : 'border-line bg-column'
            }`}
          >
            <Text
              className={`text-[12.5px] ${active ? 'font-medium text-text' : 'font-regular text-sub'}`}
            >
              {s.name}
            </Text>
            {active && <CheckIcon size={13} color={palette.info} />}
          </Pressable>
        );
      })}
    </View>
  );
}

function BlockEditor({
  index,
  kind,
  count,
  control,
  invalid,
  onMove,
  onRemove,
}: {
  index: number;
  kind: BlockKind;
  count: number;
  control: Control<FormValues>;
  invalid: boolean;
  onMove: (to: number) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const palette = usePalette();
  const name = t(`knowledge.block.${kind}`);
  const input = `${fieldBox} border-line bg-panel`;

  const iconButton = (label: string, disabled: boolean, onPress: () => void, icon: ReactNode) => (
    <Tooltip content={label}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${name} ${index + 1}`}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        hitSlop={4}
        className={`size-8 items-center justify-center rounded-6 active:bg-row-highlight ${
          disabled ? 'opacity-30' : ''
        }`}
      >
        {icon}
      </Pressable>
    </Tooltip>
  );

  const textInput = (
    field: 'text' | 'title',
    props: { placeholder: string; label: string; multiline?: boolean; className: string },
  ) => (
    <Controller
      control={control}
      name={`blocks.${index}.${field}`}
      render={({ field: f }) => (
        <TextInput
          value={f.value}
          onChangeText={f.onChange}
          onBlur={f.onBlur}
          multiline={props.multiline}
          textAlignVertical={props.multiline ? 'top' : undefined}
          placeholder={props.placeholder}
          placeholderTextColor={palette.dim}
          accessibilityLabel={props.label}
          className={`${input} mt-2 ${props.className}`}
        />
      )}
    />
  );

  return (
    <View
      className={`rounded-9 border bg-surface p-3 ${invalid ? 'border-danger' : 'border-line'}`}
    >
      <View className="flex-row items-center gap-1">
        <Text className={`${capsTitle} flex-1`}>{name}</Text>
        {iconButton(
          t('knowledge.moveUp'),
          index === 0,
          () => onMove(index - 1),
          <View style={{ transform: [{ rotate: '180deg' }] }}>
            <ChevronDownIcon size={13} color={palette.faint} />
          </View>,
        )}
        {iconButton(
          t('knowledge.moveDown'),
          index === count - 1,
          () => onMove(index + 1),
          <ChevronDownIcon size={13} color={palette.faint} />,
        )}
        {iconButton(
          t('knowledge.removeBlock'),
          false,
          onRemove,
          <XIcon size={14} color={palette.faint} />,
        )}
      </View>

      {kind === 'heading' &&
        textInput('text', {
          label: name,
          placeholder: t('knowledge.headingPlaceholder'),
          className: 'h-[42px] font-semibold text-[15px] tracking-[-0.2px]',
        })}
      {kind === 'paragraph' &&
        textInput('text', {
          label: name,
          multiline: true,
          placeholder: t('knowledge.paragraphPlaceholder'),
          className: 'min-h-[88px] py-[10px] text-[13.5px] leading-[21px]',
        })}
      {kind === 'list' && (
        <>
          {textInput('text', {
            label: name,
            multiline: true,
            placeholder: t('knowledge.listHint'),
            className: 'min-h-[88px] py-[10px] text-[13.5px] leading-[21px]',
          })}
          <Text className="mt-1 font-regular text-[11px] text-dim">{t('knowledge.listHint')}</Text>
        </>
      )}
      {kind === 'note' && (
        <>
          {textInput('title', {
            label: t('knowledge.noteTitle'),
            placeholder: t('knowledge.noteTitle'),
            className: 'h-[42px] font-semibold',
          })}
          {textInput('text', {
            label: t('knowledge.noteText'),
            multiline: true,
            placeholder: t('knowledge.noteText'),
            className: 'min-h-[66px] py-[10px] leading-[19px]',
          })}
        </>
      )}
      {invalid && (
        <Text className="mt-1 font-regular text-[11.5px] text-danger">
          {t('knowledge.errorBlock')}
        </Text>
      )}
    </View>
  );
}

const linkRow =
  'min-h-[44px] flex-row items-center gap-[9px] rounded-8 border border-line bg-surface py-[7px] pl-[13px] pr-1';

function RemoveButton({ label, onPress }: { label: string; onPress: () => void }) {
  const palette = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      className="size-8 items-center justify-center rounded-6 active:bg-row-highlight"
    >
      <XIcon size={14} color={palette.faint} />
    </Pressable>
  );
}

/**
 * Вложения: на мобильном пока только список с удалением — выбор файлов появится вместе
 * с загрузкой на бэкенд (expo-document-picker не установлен)
 */
function Attachments({
  value,
  onChange,
}: {
  value: KbAttachment[];
  onChange: (list: KbAttachment[]) => void;
}) {
  const { t } = useTranslation();
  const palette = usePalette();
  return (
    <View>
      <Text accessibilityRole="header" className={capsTitle}>
        {t('knowledge.attachments')}
      </Text>
      <View className="mt-3 gap-2">
        {value.map((f) => (
          <View key={f.id} className={linkRow}>
            <AttachLargeIcon size={17} color={palette.faint} />
            <Text numberOfLines={1} className="flex-1 font-regular text-[12.5px] text-sub">
              {f.name}
            </Text>
            <Text className="font-regular text-[10.5px] tracking-[0.3px] text-dim">{f.ext}</Text>
            <RemoveButton
              label={`${t('knowledge.removeAttachment')}: ${f.name}`}
              onPress={() => onChange(value.filter((a) => a.id !== f.id))}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

function RelatedTasksField({
  value,
  onChange,
}: {
  value: KbRelatedTask[];
  onChange: (list: KbRelatedTask[]) => void;
}) {
  const { t } = useTranslation();
  const palette = usePalette();
  const tasks = useTasks('department');
  const linked = new Set(value.map((r) => r.id));
  const options = (tasks.data ?? [])
    .filter((task) => !linked.has(task.id))
    .map((task) => ({
      value: task.id,
      label: task.title,
      hint: t(`tasks.status.${task.status}`),
    }));

  return (
    <View>
      <Text accessibilityRole="header" className={capsTitle}>
        {t('knowledge.relatedTasks')}
      </Text>
      {value.length > 0 && (
        <View className="mt-3 gap-2">
          {value.map((task, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: у задачи без доступа нет ID
            <View key={`${task.id}-${i}`} className={linkRow}>
              <TasksSmallIcon size={14} color={palette.info} />
              <View className="flex-1">
                <Text numberOfLines={2} className="font-regular text-[12.5px] text-text">
                  {task.title}
                </Text>
                <Text
                  className={`mt-1 self-start overflow-hidden rounded-[5px] px-[6px] py-[2px] font-medium text-[10px] ${statusChip[task.status]}`}
                >
                  {t(`tasks.status.${task.status}`)}
                </Text>
              </View>
              <RemoveButton
                label={`${t('knowledge.unlink')}: ${task.title}`}
                onPress={() => onChange(value.filter((_, j) => j !== i))}
              />
            </View>
          ))}
        </View>
      )}
      <LinkPicker
        placeholder={t('knowledge.linkTask')}
        empty={t('knowledge.nothingToLink')}
        options={options}
        onPick={(id) => {
          const task = tasks.data?.find((x) => x.id === id);
          if (task) onChange([...value, { id: task.id, title: task.title, status: task.status }]);
        }}
      />
    </View>
  );
}

function RelatedDocumentsField({
  value,
  onChange,
}: {
  value: KbRelatedDocument[];
  onChange: (list: KbRelatedDocument[]) => void;
}) {
  const { t } = useTranslation();
  const palette = usePalette();
  const documents = useLinkableDocuments();
  const pool = documents.data ?? [];
  const options = pool
    .map((doc, i) => ({ doc, value: String(i) }))
    .filter(({ doc }) => !value.some((v) => sameDocument(v, doc)))
    .map(({ doc, value: v }) => ({ value: v, label: doc.number, hint: doc.title }));

  return (
    <View>
      <Text accessibilityRole="header" className={capsTitle}>
        {t('knowledge.relatedDocuments', { count: 2 })}
      </Text>
      {value.length > 0 && (
        <View className="mt-3 gap-2">
          {value.map((doc, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: номера документов в заглушке повторяются
            <View key={i} className={linkRow}>
              <DocSmallIcon size={14} color={palette.faint} />
              <View className="flex-1">
                <Text numberOfLines={1} className="font-regular text-[12.5px] text-text">
                  {doc.number}
                </Text>
                <Text numberOfLines={2} className="font-regular text-[11px] text-dim">
                  {doc.title}
                </Text>
              </View>
              <RemoveButton
                label={`${t('knowledge.unlink')}: ${doc.number}`}
                onPress={() => onChange(value.filter((_, j) => j !== i))}
              />
            </View>
          ))}
        </View>
      )}
      <LinkPicker
        placeholder={t('knowledge.linkDocument')}
        empty={t('knowledge.nothingToLink')}
        options={options}
        onPick={(i) => {
          const doc = pool[Number(i)];
          if (doc) onChange([...value, doc]);
        }}
      />
    </View>
  );
}
