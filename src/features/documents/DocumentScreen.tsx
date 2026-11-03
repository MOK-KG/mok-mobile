import { router } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useCan } from '@/features/auth';
import { useTasks } from '@/features/tasks/api';
import { dueProblem } from '@/features/tasks/deadline';
import { Avatar, Choices, DueField, dueMessage, staff, useErrorText } from '@/features/tasks/parts';
import { themes } from '@/shared/config/tokens';
import { formatInBishkek, formatIsoDate } from '@/shared/lib/date';
import { addWorkingDays, type IsoDate, todayInBishkek } from '@/shared/lib/workDays';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import { docNumber, useAnnul, useDocument, useIssue, useMarkDone, useResolve } from './api';
import { StatusChip } from './parts';
import type { DocumentRecord } from './types';

const caps = 'font-semibold text-[10px] uppercase tracking-[1.4px] text-dim';

/** Карточка документа: поля, резолюция, действия по правам, журнал */
export function DocumentScreen({ docId }: { docId: string }) {
  const { t } = useTranslation();
  const query = useDocument(docId);
  const doc = query.data;
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScreenHeader
        title={doc ? (docNumber(doc) ?? t('documents.noNumber')) : t('sections.documents')}
        fallback="/documents"
      />
      {doc ? (
        <Body doc={doc} />
      ) : (
        <Text className="p-6 font-regular text-[13px] text-dim">
          {query.isPending ? t('documents.loading') : t('documents.notFound')}
        </Text>
      )}
    </SafeAreaView>
  );
}

function Button({
  label,
  onPress,
  primary = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      className={`h-11 flex-1 items-center justify-center rounded-9 px-4 ${
        primary ? 'bg-brand-red' : 'border border-line bg-control'
      } ${disabled ? 'opacity-50' : ''}`}
    >
      <Text
        className={`text-[13.5px] ${primary ? 'font-semibold text-[#FFFFFF]' : 'font-medium text-sub'}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <View className={`rounded-14 border border-line bg-panel p-4 ${className}`}>{children}</View>
  );
}

function Body({ doc }: { doc: DocumentRecord }) {
  const { t, i18n } = useTranslation();
  const { can } = useCan();
  const [form, setForm] = useState<'resolution' | 'annul' | null>(null);
  const issue = useIssue();
  const markDone = useMarkDone();
  const number = docNumber(doc);
  const date = (d: IsoDate) => formatIsoDate(d, 'd MMMM yyyy', i18n.language);
  const rows: [string, string | null][] = [
    [t('documents.field.kind'), t(`documents.kind.${doc.kind}`)],
    [t(`documents.field.date.${doc.seq === null ? 'draft' : doc.kind}`), date(doc.date)],
    [doc.kind === 'incoming' ? t('documents.field.from') : t('documents.field.to'), doc.party],
    [t('documents.field.senderRef'), doc.senderRef],
    [t(`documents.field.author.${doc.kind}`), doc.author.short],
    [t('documents.field.signer'), doc.signer?.short ?? null],
  ];

  return (
    <ScrollView
      contentContainerClassName="gap-3 px-4 pb-10 pt-2"
      keyboardShouldPersistTaps="handled"
    >
      <Card>
        <StatusChip status={doc.status} />
        <Text className="mt-2 font-semibold text-[17px] leading-[22px] tracking-[-0.3px] text-text">
          {doc.title}
        </Text>
        <View className="mt-3">
          {rows
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <View key={k} className="flex-row gap-3 border-t border-line py-[7px]">
                <Text className="w-[130px] font-regular text-[12.5px] text-faint">{k}</Text>
                <Text className="flex-1 font-regular text-[12.5px] text-text">{v}</Text>
              </View>
            ))}
        </View>
        {!!doc.summary && (
          <Text className="mt-3 font-regular text-[13px] leading-[19px] text-sub">
            {doc.summary}
          </Text>
        )}
        {doc.attachments.map((name) => (
          <Text
            key={name}
            className="mt-2 rounded-8 border border-line bg-surface px-3 py-2 font-regular text-[12.5px] text-sub"
          >
            {name}
          </Text>
        ))}
      </Card>

      {doc.annulment && (
        <View className="rounded-11 border border-danger-line bg-danger-chip p-4">
          <Text className="font-semibold text-[13px] text-danger">
            {t('documents.annulledTitle')}
          </Text>
          <Text className="mt-1 font-regular text-[12.5px] text-sub">{doc.annulment.reason}</Text>
          <Text className="mt-1 font-regular text-[11px] text-faint">
            {doc.annulment.by.short} ·{' '}
            {formatInBishkek(doc.annulment.at, 'd MMM, HH:mm', i18n.language)}
            {number && ` · ${t('documents.numberKept', { number })}`}
          </Text>
        </View>
      )}

      {doc.resolution && <ResolutionCard doc={doc} />}
      {form === 'resolution' && <ResolutionForm doc={doc} onDone={() => setForm(null)} />}
      {form === 'annul' && <AnnulForm doc={doc} onDone={() => setForm(null)} />}

      {form === null && (
        <View className="gap-2">
          {doc.status === 'registered' && can('documents.resolve') && (
            <Button
              primary
              label={t('documents.action.resolve')}
              onPress={() => setForm('resolution')}
            />
          )}
          {doc.status === 'inWork' && can('documents.resolve') && (
            <Button
              primary
              label={t('documents.action.done')}
              disabled={markDone.isPending}
              onPress={() => markDone.mutate(doc.id)}
            />
          )}
          {doc.status === 'draft' && can('documents.register') && (
            <Button
              primary
              label={t(`documents.action.issue.${doc.kind === 'order' ? 'order' : 'outgoing'}`)}
              disabled={issue.isPending}
              onPress={() => issue.mutate(doc.id)}
            />
          )}
          {doc.status !== 'annulled' && can('documents.annul') && (
            <Button label={t('documents.action.annul')} onPress={() => setForm('annul')} />
          )}
          {doc.status === 'draft' && (
            <Text className="font-regular text-[11.5px] leading-4 text-dim">
              {t('documents.issueHint')}
            </Text>
          )}
        </View>
      )}

      <Card>
        <Text className={caps}>{t('documents.history')}</Text>
        {doc.history.map((h) => (
          <View key={h.id} className="mt-3">
            <Text className="font-regular text-[12.5px] text-sub">
              <Text className="text-text">{h.by.short}</Text> ·{' '}
              {t(`documents.historyKind.${h.kind}`)}
            </Text>
            {!!h.text && (
              <Text className="mt-[2px] font-regular text-[12px] text-faint">«{h.text}»</Text>
            )}
            <Text className="mt-[2px] font-regular text-[11px] text-dim">
              {formatInBishkek(h.at, 'd MMM yyyy, HH:mm', i18n.language)}
            </Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

function ResolutionCard({ doc }: { doc: DocumentRecord }) {
  const { t, i18n } = useTranslation();
  const active = useTasks('department').data ?? [];
  const done = useTasks('completed').data ?? [];
  const r = doc.resolution;
  if (!r) return null;
  const task = [...active, ...done].find((x) => x.title === r.taskTitle);
  return (
    <View className="rounded-14 border border-info-line bg-info-chip p-4">
      <Text className={caps}>{t('documents.resolution')}</Text>
      <Text className="mt-2 font-regular text-[14px] leading-[19px] text-text">«{r.text}»</Text>
      <View className="mt-2 flex-row flex-wrap items-center gap-2">
        <Avatar person={r.assignee} size={20} />
        <Text className="font-regular text-[12.5px] text-sub">
          {r.assignee.short} ·{' '}
          {t('documents.dueTo', { date: formatIsoDate(r.due, 'd MMMM', i18n.language) })}
        </Text>
      </View>
      <Text className="mt-1 font-regular text-[11px] text-dim">
        {r.author.short} · {formatInBishkek(r.at, 'd MMM, HH:mm', i18n.language)}
      </Text>
      {task && (
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push(`/tasks/${task.id}`)}
          className="mt-3"
          hitSlop={6}
        >
          <Text className="font-medium text-[13px] text-info">
            {t('documents.openTask', { code: task.code })}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function ResolutionForm({ doc, onDone }: { doc: DocumentRecord; onDone: () => void }) {
  const { t } = useTranslation();
  const palette = themes[useTheme().theme];
  const errorText = useErrorText();
  const resolve = useResolve();
  const [text, setText] = useState('');
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [due, setDue] = useState<IsoDate>(addWorkingDays(todayInBishkek(), 5));
  const [tried, setTried] = useState(false);
  const problem = dueProblem(due);
  const dueError = problem ? errorText(dueMessage(problem)) : null;
  const textError = text.trim().length < 3 ? t('documents.form.errorResolution') : null;
  const assigneeError = assigneeId ? null : t('newTask.errorAssignee');

  const submit = () => {
    setTried(true);
    const assignee = staff.find((p) => p.id === assigneeId);
    if (textError || dueError || !assignee) return;
    resolve.mutate({ id: doc.id, text, assignee, due }, { onSuccess: onDone });
  };

  return (
    <Card className="gap-3">
      <Text className={caps}>{t('documents.action.resolve')}</Text>
      <TextInput
        multiline
        value={text}
        onChangeText={setText}
        placeholder={t('documents.form.resolutionPlaceholder')}
        placeholderTextColor={palette.dim}
        accessibilityLabel={t('documents.form.resolutionText')}
        className={`min-h-[80px] rounded-8 border bg-column px-3 py-2 font-regular text-[13.5px] text-text ${
          tried && textError ? 'border-danger' : 'border-line'
        }`}
      />
      {tried && textError && (
        <Text className="font-regular text-[11.5px] text-danger">{textError}</Text>
      )}
      <Choices
        label={t('newTask.assignee')}
        value={assigneeId}
        onChange={setAssigneeId}
        invalid={tried && !!assigneeError}
        options={staff.map((p) => ({
          value: p.id,
          label: p.short,
          prefix: <Avatar person={p} size={20} />,
        }))}
      />
      {tried && assigneeError && (
        <Text className="font-regular text-[11.5px] text-danger">{assigneeError}</Text>
      )}
      <DueField label={t('newTask.due')} value={due} onChange={setDue} invalid={!!dueError} />
      {dueError && <Text className="font-regular text-[11.5px] text-danger">{dueError}</Text>}
      <Text className="font-regular text-[11.5px] leading-4 text-faint">
        {t('documents.resolutionHint')}
      </Text>
      <View className="flex-row gap-2">
        <Button label={t('documents.cancel')} onPress={onDone} />
        <Button
          primary
          label={t('documents.form.submitResolution')}
          disabled={resolve.isPending}
          onPress={submit}
        />
      </View>
    </Card>
  );
}

function AnnulForm({ doc, onDone }: { doc: DocumentRecord; onDone: () => void }) {
  const { t } = useTranslation();
  const palette = themes[useTheme().theme];
  const annul = useAnnul();
  const [reason, setReason] = useState('');
  const [tried, setTried] = useState(false);
  const error = reason.trim().length < 5 ? t('documents.form.errorReason') : null;
  const number = docNumber(doc);

  return (
    <Card className="gap-3 border-danger-line">
      <Text className={caps}>{t('documents.action.annul')}</Text>
      <Text className="font-regular text-[12.5px] leading-[18px] text-sub">
        {number ? t('documents.annulHint', { number }) : t('documents.annulDraftHint')}
      </Text>
      <TextInput
        multiline
        value={reason}
        onChangeText={setReason}
        placeholderTextColor={palette.dim}
        placeholder={t('documents.form.reason')}
        accessibilityLabel={t('documents.form.reason')}
        className={`min-h-[64px] rounded-8 border bg-column px-3 py-2 font-regular text-[13.5px] text-text ${
          tried && error ? 'border-danger' : 'border-line'
        }`}
      />
      {tried && error && <Text className="font-regular text-[11.5px] text-danger">{error}</Text>}
      <View className="flex-row gap-2">
        <Button label={t('documents.cancel')} onPress={onDone} />
        <Button
          primary
          label={t('documents.action.annul')}
          disabled={annul.isPending}
          onPress={() => {
            setTried(true);
            if (!error) annul.mutate({ id: doc.id, reason }, { onSuccess: onDone });
          }}
        />
      </View>
    </Card>
  );
}
