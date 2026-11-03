import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCan } from '@/features/auth';
import { Choices } from '@/features/tasks/parts';
import { type RoleCode, roleCodes } from '@/shared/config/permissions';
import { formatInBishkek, formatIsoDate } from '@/shared/lib/date';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import { type StaffRow, useChangeRole, useDeactivate, useStaff } from './api';
import { RoleChip, StaffAvatar, StatusBadge } from './parts';

const caps = 'font-semibold text-[10px] uppercase tracking-[1.4px] text-dim';

/** Карточка сотрудника: сведения, смена роли (roles.assign), увольнение (staff.deactivate) */
export function StaffScreen({ staffId }: { staffId: string }) {
  const { t } = useTranslation();
  const staff = useStaff();
  const member = staff.data?.find((r) => r.id === staffId);
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScreenHeader title={t('sections.access')} fallback="/access" />
      {member ? (
        <Body m={member} />
      ) : (
        <Text className="p-6 font-regular text-[13px] text-dim">
          {staff.isPending ? t('documents.loading') : t('access.nothingFound')}
        </Text>
      )}
    </SafeAreaView>
  );
}

function Body({ m }: { m: StaffRow }) {
  const { t, i18n } = useTranslation();
  const { can } = useCan();
  const changeRole = useChangeRole();
  const active = m.status === 'active' || m.status === 'invited';
  const rows: [string, string][] = [
    [t('access.position'), m.position],
    [t('access.department'), t('access.departmentOf', { name: m.department })],
    ...(m.email ? ([['E-mail', m.email]] as [string, string][]) : []),
    ...(m.invitedAt
      ? ([[t('access.invitedAt'), formatIsoDate(m.invitedAt, 'd MMMM yyyy', i18n.language)]] as [
          string,
          string,
        ][])
      : []),
    [
      t('access.firstLogin'),
      m.firstLoginAt
        ? formatInBishkek(m.firstLoginAt, 'd MMM yyyy, HH:mm', i18n.language)
        : t('access.neverLoggedIn'),
    ],
    [
      t('access.sessions'),
      m.sessions ? t('access.devices', { count: m.sessions }) : t('access.noSessions'),
    ],
    [
      t('access.activeTasks'),
      `${m.plan.tasks}${m.plan.escalated ? ` · ${t('access.withEscalation')}` : ''}`,
    ],
    [t('access.deputy'), m.deputy ?? '—'],
  ];

  const pickRole = (role: RoleCode) => {
    if (role === m.role) return;
    const apply = () => changeRole.mutate({ id: m.id, role });
    if (m.isMe) {
      Alert.alert(t('access.role'), t('access.ownRoleConfirm', { role }), [
        { text: t('access.cancel'), style: 'cancel' },
        { text: t('access.role'), onPress: apply },
      ]);
    } else apply();
  };

  return (
    <ScrollView contentContainerClassName="gap-3 px-4 pb-10 pt-2">
      <View className="items-center gap-2 rounded-14 border border-line bg-panel p-5">
        <StaffAvatar name={m.name} tone={m.tone} size={56} />
        <Text className="font-semibold text-[17px] tracking-[-0.3px] text-text">
          {m.name ?? t('access.vacant')}
          {m.isMe && <Text className="font-regular text-faint"> · {t('access.you')}</Text>}
        </Text>
        <View className="flex-row items-center gap-2">
          <RoleChip role={m.role} />
          <Text className="font-regular text-[12.5px] text-sub">{t(`access.roles.${m.role}`)}</Text>
          <StatusBadge badge={m.badge} />
        </View>
      </View>

      <View className="rounded-14 border border-line bg-panel px-4 py-2">
        {rows.map(([k, v]) => (
          <View key={k} className="flex-row gap-3 border-b border-line py-[9px] last:border-b-0">
            <Text className="w-[130px] font-regular text-[12.5px] text-faint">{k}</Text>
            <Text className="flex-1 font-regular text-[12.5px] text-text">{v}</Text>
          </View>
        ))}
      </View>

      {active && can('roles.assign') && (
        <View className="gap-2 rounded-14 border border-line bg-panel p-4">
          <Text className={caps}>{t('access.role')}</Text>
          <Choices
            label={t('access.role')}
            value={m.role}
            onChange={pickRole}
            options={roleCodes.map((r) => ({
              value: r,
              label: `${r} · ${t(`access.roles.${r}`)}`,
            }))}
          />
          <Text className="font-regular text-[11.5px] leading-4 text-faint">
            {t('access.roleHints.' + m.role)}
          </Text>
          <Text className="font-medium text-[12px] text-success">{t('access.immediate')}</Text>
          <Text className="font-regular text-[11.5px] leading-4 text-faint">
            {t('access.immediateHint')}
          </Text>
        </View>
      )}

      {m.status === 'deactivated' && (
        <View className="rounded-11 border border-danger-line bg-danger-chip p-4">
          <Text className="font-semibold text-[13px] text-danger">
            {t('access.deactivatedOn', {
              date: m.deactivatedAt
                ? formatIsoDate(m.deactivatedAt, 'd MMMM yyyy', i18n.language)
                : '',
              by: m.deactivatedBy ?? '',
            })}
          </Text>
          <Text className="mt-1 font-regular text-[12.5px] leading-[18px] text-sub">
            {t('access.deactivatedText')}
          </Text>
        </View>
      )}

      {active && can('staff.deactivate') && <Dismissal m={m} />}
    </ScrollView>
  );
}

function Dismissal({ m }: { m: StaffRow }) {
  const { t } = useTranslation();
  const deactivate = useDeactivate();
  const [confirming, setConfirming] = useState(false);
  const { plan } = m;
  const to = plan.reassignTo;
  const items: [string, string][] = [
    [t('access.loginClosed'), t('access.loginClosedHint')],
    [t('access.sessionsEnded'), t('access.sessionsEndedHint')],
    [
      plan.tasks > 0 ? t('access.tasksReassigned', { count: plan.tasks }) : t('access.noTasks'),
      plan.tasks === 0
        ? t('access.noTasksHint')
        : to
          ? t(to.isDirector ? 'access.toDirector' : 'access.toManager', { name: to.short })
          : t('access.noSuccessor'),
    ],
    [t('access.authorshipKept'), t('access.authorshipKeptHint')],
  ];

  return (
    <View className="gap-3 rounded-14 border border-line bg-panel p-4">
      <Text className={caps}>{t('access.dismissal')}</Text>
      <Text className="font-regular text-[12.5px] text-sub">{t('access.whatHappens')}</Text>
      {items.map(([title, text]) => (
        <View key={title}>
          <Text className="font-regular text-[13px] text-text">{title}</Text>
          <Text className="font-regular text-[11.5px] text-faint">{text}</Text>
        </View>
      ))}
      {m.isMe ? (
        <Text className="font-regular text-[12px] text-warning-text">
          {t('access.cannotDeactivateSelf')}
        </Text>
      ) : (
        <Pressable
          accessibilityRole="button"
          disabled={deactivate.isPending}
          onPress={() => (confirming ? deactivate.mutate(m.id) : setConfirming(true))}
          className={`h-11 items-center justify-center rounded-9 ${
            confirming ? 'bg-brand-red' : 'border border-danger-line'
          } ${deactivate.isPending ? 'opacity-50' : ''}`}
        >
          <Text
            className={`font-semibold text-[13.5px] ${confirming ? 'text-[#FFFFFF]' : 'text-danger'}`}
          >
            {confirming ? t('access.confirmDeactivate', { name: m.short }) : t('access.deactivate')}
          </Text>
        </Pressable>
      )}
      <Text className="font-regular text-[11px] text-dim">{t('access.cannotDelete')}</Text>
    </View>
  );
}
