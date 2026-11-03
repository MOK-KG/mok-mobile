import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useCurrentAbsences } from '@/features/absences/api';
import { useSession } from '@/features/auth';
import {
  type NotificationSettings,
  notificationKinds,
  useNotificationSettings,
  useSaveNotificationSettings,
} from '@/features/notifications/api';
import { currentUserId } from '@/features/tasks/directory';
import type { RoleCode } from '@/shared/config/permissions';
import { themes } from '@/shared/config/tokens';
import { formatIsoDate } from '@/shared/lib/date';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';

const caps = 'font-semibold text-[10px] uppercase tracking-[1.4px] text-dim';

/** Профиль и уведомления (S-27): роль, какие уведомления получать, мои отсутствия */
export function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const palette = themes[useTheme().theme];
  const user = useSession().data?.user;
  const settings = useNotificationSettings().data;
  const save = useSaveNotificationSettings();
  const [draft, setDraft] = useState<NotificationSettings | null>(null);
  const absences = (useCurrentAbsences().data ?? []).filter(
    (a) => a.person.id === currentUserId || a.deputy.id === currentUserId,
  );
  useEffect(() => {
    if (settings) setDraft(settings);
  }, [settings]);
  if (!user) return null;
  const role = user.roles[0] as RoleCode | undefined;
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);
  const date = (d: string) => formatIsoDate(d, 'd MMM', i18n.language).replace('.', '');

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScreenHeader title={t('profile.title')} fallback="/more" />
      <ScrollView contentContainerClassName="gap-3 px-4 pb-10 pt-1">
        <View className="gap-1 rounded-14 border border-line bg-panel p-4">
          <Text className="font-semibold text-[17px] text-text">{user.name}</Text>
          <Text className="font-regular text-[12.5px] text-sub">
            {[user.position, user.department].filter(Boolean).join(' · ')}
          </Text>
          <Text className="font-regular text-[12px] text-faint">{user.email}</Text>
          {role && (
            <>
              <Text className="mt-2 font-medium text-[13px] text-text">
                {role} · {t(`access.roles.${role}`)}
              </Text>
              <Text className="font-regular text-[12px] text-faint">
                {t(`access.roleHints.${role}`)}
              </Text>
            </>
          )}
        </View>

        <View className="gap-2 rounded-14 border border-line bg-panel p-4">
          <Text className={caps}>{t('notifications.settingsTitle')}</Text>
          <Text className="font-regular text-[12px] leading-4 text-faint">
            {t('notifications.settingsHint')}
          </Text>
          {notificationKinds.map((k) => {
            const locked = k === 'escalation';
            const on = locked || !!draft?.[k];
            return (
              <View key={k} className="flex-row items-center gap-3 border-t border-line pt-2">
                <View className="flex-1">
                  <Text className="font-regular text-[13.5px] text-text">
                    {t(`notifications.kinds.${k}`)}
                  </Text>
                  {locked && (
                    <Text className="font-regular text-[11px] text-dim">
                      {t('notifications.escalationLocked')}
                    </Text>
                  )}
                </View>
                <Switch
                  accessibilityLabel={t(`notifications.kinds.${k}`)}
                  value={on}
                  disabled={locked}
                  onValueChange={(v) => {
                    if (draft) setDraft({ ...draft, [k]: v });
                  }}
                  trackColor={{ true: palette.info, false: palette.chip }}
                />
              </View>
            );
          })}
          <Pressable
            accessibilityRole="button"
            disabled={!dirty || save.isPending}
            onPress={() => draft && save.mutate(draft)}
            className={`mt-2 h-11 items-center justify-center rounded-9 bg-brand-red ${
              !dirty ? 'opacity-50' : ''
            }`}
          >
            <Text className="font-semibold text-[13.5px] text-[#FFFFFF]">{t('profile.save')}</Text>
          </Pressable>
        </View>

        <View className="gap-2 rounded-14 border border-line bg-panel p-4">
          <Text className={caps}>{t('absences.title')}</Text>
          {absences.length === 0 ? (
            <Text className="font-regular text-[12.5px] text-dim">{t('profile.noAbsences')}</Text>
          ) : (
            absences.map((a) => (
              <Text key={a.id} className="font-regular text-[12.5px] text-sub">
                {a.person.id === currentUserId
                  ? t('profile.myAbsence', {
                      kind: t(`absences.kind.${a.kind}`),
                      from: date(a.from),
                      to: date(a.to),
                      deputy: a.deputy.short,
                    })
                  : t('profile.covering', {
                      name: a.person.short,
                      from: date(a.from),
                      to: date(a.to),
                    })}
              </Text>
            ))
          )}
          <Pressable accessibilityRole="link" onPress={() => router.push('/absences')} hitSlop={6}>
            <Text className="font-medium text-[13px] text-info">{t('absences.new')}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
