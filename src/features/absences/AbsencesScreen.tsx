import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useCan, useMe } from '@/features/auth';
import {
  type Absence,
  type AbsenceKind,
  absenceKinds,
  currentAbsences,
} from '@/features/tasks/absences';
import { Avatar, Choices, DueField } from '@/features/tasks/parts';
import type { Person } from '@/features/tasks/types';
import { themes } from '@/shared/config/tokens';
import { formatIsoDate } from '@/shared/lib/date';
import { diffDays, type IsoDate, todayInBishkek } from '@/shared/lib/workDays';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import {
  type AbsenceProblem,
  absenceProblems,
  absenceWorkingDays,
  useAbsencePeople,
  useAbsences,
  useCancelAbsence,
  useCreateAbsence,
  useUpdateAbsence,
} from './api';

function useMePerson(staff: Person[]): Person {
  const user = useMe();
  const id = user?.id ?? '';
  const name = user?.name ?? '';
  return staff.find((p) => p.id === id) ?? { id, name, short: name, tone: 'blue' };
}
const caps = 'font-semibold text-[10px] uppercase tracking-[1.4px] text-dim';

type Group = 'now' | 'upcoming' | 'past' | 'cancelled';
const groups: Group[] = ['now', 'upcoming', 'past', 'cancelled'];

function groupOf(a: Absence, today: IsoDate): Group {
  if (a.status === 'cancelled') return 'cancelled';
  if (diffDays(today, a.from) > 0) return 'upcoming';
  if (diffDays(a.to, today) > 0) return 'past';
  return 'now';
}

/** Отпуск и командировки (из «Ещё»): как на вебе — заместитель обязателен (приёмка 11.10) */
export function AbsencesScreen() {
  const { t, i18n } = useTranslation();
  const { can } = useCan();
  const canManage = can('staff.manage') || can('tasks.assign');
  const canRequest = canManage || can('absences.request');
  const today = todayInBishkek();
  const list = useAbsences().data ?? [];
  const staff = useAbsencePeople().data ?? [];
  const me = useMePerson(staff);
  const [creating, setCreating] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const date = (d: IsoDate) => formatIsoDate(d, 'd MMM', i18n.language).replace('.', '');

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScreenHeader title={t('absences.title')} fallback="/more" />
      <ScrollView
        contentContainerClassName="gap-3 px-4 pb-10 pt-1"
        keyboardShouldPersistTaps="handled"
      >
        {creating ? (
          <AbsenceForm
            canManage={canManage}
            staff={staff}
            me={me}
            onDone={() => setCreating(false)}
          />
        ) : (
          canRequest && <Btn primary label={t('absences.new')} onPress={() => setCreating(true)} />
        )}
        {groups.map((g) => {
          const items = list
            .filter((a) => groupOf(a, today) === g)
            .sort((a, b) => a.from.localeCompare(b.from));
          return (
            <View key={g} className="overflow-hidden rounded-14 border border-line bg-panel">
              <View className="flex-row items-baseline gap-2 px-4 pb-1 pt-3">
                <Text className="font-semibold text-[14px] text-text">
                  {t(`absences.group.${g}`)}
                </Text>
                <Text className="font-medium text-[11px] text-dim">{items.length}</Text>
              </View>
              {items.length === 0 && (
                <Text className="px-4 pb-3 font-regular text-[12.5px] text-dim">
                  {t(`absences.empty.${g}`)}
                </Text>
              )}
              {items.map((a) => {
                const canCancel =
                  (g === 'now' || g === 'upcoming') && (canManage || a.person.id === me.id);
                return (
                  <View key={a.id} className="gap-[6px] border-t border-line px-4 py-3">
                    <View className="flex-row items-center gap-2">
                      <Avatar person={a.person} size={24} />
                      <Text className="flex-1 font-regular text-[14px] text-text">
                        {a.person.name}
                      </Text>
                      <Text className="font-medium text-[11px] text-info">
                        {t(`absences.kind.${a.kind}`)}
                      </Text>
                    </View>
                    <Text className="font-regular text-[12px] text-faint">
                      {date(a.from)} – {date(a.to)} ·{' '}
                      {t('absences.workingDays', { count: absenceWorkingDays(a.from, a.to) })}
                    </Text>
                    <Text className="font-regular text-[12px] text-sub">
                      {t('absences.deputyIs', { name: a.deputy.short })}
                    </Text>
                    {a.cancellation && (
                      <Text className="font-regular text-[12px] text-danger">
                        {t('absences.cancelledBy', {
                          by: a.cancellation.by,
                          reason: a.cancellation.reason,
                        })}
                      </Text>
                    )}
                    {canCancel && editing === a.id && (
                      <AbsenceForm
                        canManage={false}
                        staff={staff}
                        me={a.person}
                        editing={a}
                        onDone={() => setEditing(null)}
                      />
                    )}
                    {canCancel &&
                      editing !== a.id &&
                      (cancelling === a.id ? (
                        <CancelForm absence={a} onDone={() => setCancelling(null)} />
                      ) : (
                        <View className="flex-row gap-5">
                          <Pressable
                            accessibilityRole="button"
                            onPress={() => setEditing(a.id)}
                            hitSlop={6}
                          >
                            <Text className="font-medium text-[12.5px] text-info">
                              {t('absences.edit')}
                            </Text>
                          </Pressable>
                          <Pressable
                            accessibilityRole="button"
                            onPress={() => setCancelling(a.id)}
                            hitSlop={6}
                          >
                            <Text className="font-medium text-[12.5px] text-info">
                              {t('absences.cancel')}
                            </Text>
                          </Pressable>
                        </View>
                      ))}
                  </View>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function Btn({
  label,
  onPress,
  primary = false,
  disabled = false,
  grow = false,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
  disabled?: boolean;
  grow?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      className={`h-11 items-center justify-center rounded-9 px-4 ${grow ? 'flex-1' : ''} ${
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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="gap-[6px]">
      <Text className="font-medium text-[11px] tracking-[0.2px] text-sub">{label}</Text>
      {children}
    </View>
  );
}

function useProblemText() {
  const { t, i18n } = useTranslation();
  const date = (d: IsoDate) => formatIsoDate(d, 'd MMM', i18n.language).replace('.', '');
  return (p: AbsenceProblem) =>
    p.code === 'overlap' || p.code === 'deputyAbsent'
      ? t(`absences.problem.${p.code}`, {
          name: p.with.person.short,
          from: date(p.with.from),
          to: date(p.with.to),
        })
      : t(`absences.problem.${p.code}`);
}

function AbsenceForm({
  canManage,
  staff,
  me,
  editing,
  onDone,
}: {
  canManage: boolean;
  staff: Person[];
  me: Person;
  editing?: Absence;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const palette = themes[useTheme().theme];
  const create = useCreateAbsence();
  const update = useUpdateAbsence();
  const problemText = useProblemText();
  const today = todayInBishkek();
  const [kind, setKind] = useState<AbsenceKind>(editing?.kind ?? 'vacation');
  const [personId, setPersonId] = useState(me.id);
  const [from, setFrom] = useState<IsoDate>(editing?.from ?? today);
  const [to, setTo] = useState<IsoDate>(editing?.to ?? today);
  const [deputyId, setDeputyId] = useState<string | null>(editing?.deputy.id ?? null);
  const [note, setNote] = useState(editing?.note ?? '');
  const started = editing ? diffDays(editing.from, today) > 0 : false;
  const [tried, setTried] = useState(false);
  const person = staff.find((p) => p.id === personId) ?? me;
  const deputy = staff.find((p) => p.id === deputyId) ?? null;
  const input = { kind, person, from, to, deputy, note };
  const others = editing ? currentAbsences().filter((a) => a.id !== editing.id) : undefined;
  const problems = absenceProblems(input, others).filter(
    (p) => !(started && p.code === 'past' && diffDays(today, to) >= 0),
  );
  const shown = problems.filter((p) => tried || p.code !== 'deputyRequired');

  return (
    <View className="gap-3 rounded-14 border border-line bg-panel p-4">
      <Text className={caps}>{t(editing ? 'absences.editTitle' : 'absences.new')}</Text>
      <Choices
        label={t('absences.kindLabel')}
        value={kind}
        onChange={setKind}
        options={absenceKinds.map((k) => ({ value: k, label: t(`absences.kind.${k}`) }))}
      />
      {canManage && (
        <Field label={t('absences.person')}>
          <Choices
            label={t('absences.person')}
            value={personId}
            onChange={(id) => {
              setPersonId(id);
              if (id === deputyId) setDeputyId(null);
            }}
            options={staff.map((p) => ({ value: p.id, label: p.short }))}
          />
        </Field>
      )}
      {!started && (
        <Field label={t('absences.from')}>
          <DueField label={t('absences.from')} value={from} onChange={setFrom} />
        </Field>
      )}
      <Field label={t('absences.to')}>
        <DueField label={t('absences.to')} value={to} onChange={setTo} />
      </Field>
      {diffDays(from, to) >= 0 && (
        <Text className="font-regular text-[12px] text-faint">
          {t('absences.workingDays', { count: absenceWorkingDays(from, to) })}
        </Text>
      )}
      <Field label={`${t('absences.deputy')} *`}>
        <Choices
          label={t('absences.deputy')}
          value={deputyId}
          onChange={setDeputyId}
          invalid={tried && !deputy}
          options={staff
            .filter((p) => p.id !== person.id)
            .map((p) => ({ value: p.id, label: p.short, prefix: <Avatar person={p} size={20} /> }))}
        />
      </Field>
      <Text className="font-regular text-[11.5px] leading-4 text-dim">
        {t('absences.deputyHint')}
      </Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder={t(`absences.notePlaceholder.${kind}`)}
        placeholderTextColor={palette.dim}
        accessibilityLabel={t('absences.note')}
        className="h-11 rounded-8 border border-line bg-column px-3 font-regular text-[13.5px] text-text"
      />
      {shown.map((p) => (
        <Text key={p.code} className="font-regular text-[12px] text-danger">
          {problemText(p)}
        </Text>
      ))}
      <View className="flex-row gap-2">
        <Btn grow label={t('documents.cancel')} onPress={onDone} />
        <Btn
          grow
          primary
          label={t('absences.save')}
          disabled={create.isPending || update.isPending}
          onPress={() => {
            setTried(true);
            if (problems.length > 0) return;
            if (editing) update.mutate({ id: editing.id, input }, { onSuccess: onDone });
            else create.mutate(input, { onSuccess: onDone });
          }}
        />
      </View>
    </View>
  );
}

function CancelForm({ absence, onDone }: { absence: Absence; onDone: () => void }) {
  const { t } = useTranslation();
  const palette = themes[useTheme().theme];
  const cancel = useCancelAbsence();
  const [reason, setReason] = useState('');
  const [tried, setTried] = useState(false);
  const error = reason.trim().length < 5 ? t('absences.errorReason') : null;
  return (
    <View className="gap-2 pt-1">
      <Text className="font-regular text-[12px] leading-4 text-faint">
        {t('absences.cancelHint', { name: absence.person.short, deputy: absence.deputy.short })}
      </Text>
      <TextInput
        value={reason}
        onChangeText={setReason}
        placeholder={t('absences.reason')}
        placeholderTextColor={palette.dim}
        accessibilityLabel={t('absences.reason')}
        className={`h-11 rounded-8 border bg-column px-3 font-regular text-[13.5px] text-text ${
          tried && error ? 'border-danger' : 'border-line'
        }`}
      />
      {tried && error && <Text className="font-regular text-[12px] text-danger">{error}</Text>}
      <View className="flex-row gap-2">
        <Btn grow label={t('documents.cancel')} onPress={onDone} />
        <Btn
          grow
          primary
          label={t('absences.cancel')}
          disabled={cancel.isPending}
          onPress={() => {
            setTried(true);
            if (!error) cancel.mutate({ id: absence.id, reason }, { onSuccess: onDone });
          }}
        />
      </View>
    </View>
  );
}
