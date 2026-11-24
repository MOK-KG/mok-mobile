import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useCan } from '@/features/auth';
import { type Permission, permissions } from '@/shared/config/permissions';
import { themes } from '@/shared/config/tokens';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import { type RoleInfo, useRoleMatrix, useSaveRolePermissions } from './api';
import { RoleChip } from './parts';

const groupTitle: Record<string, string> = {
  tasks: 'sections.tasks',
  documents: 'sections.documents',
  knowledge: 'sections.knowledge',
  chat: 'sections.chat',
  calendar: 'sections.calendar',
  files: 'sections.files',
  staff: 'sections.access',
  roles: 'sections.access',
  journal: 'journal.title',
  assistant: 'assistant.title',
};

const caps = 'font-semibold text-[10px] uppercase tracking-[1.4px] text-dim';

export function RoleListScreen() {
  const { t } = useTranslation();
  const matrix = useRoleMatrix();
  const roles = matrix.data ?? [];
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScreenHeader title={t('access.matrix')} fallback="/access" />
      <ScrollView contentContainerClassName="gap-2 p-4">
        <Text className="font-regular text-[12px] leading-4 text-dim">
          {t('access.matrixSubtitle')}
        </Text>
        {matrix.data === null && (
          <Text className="font-regular text-[13px] text-dim">{t('access.matrixUnavailable')}</Text>
        )}
        {roles.map((role) => (
          <Pressable
            key={role.code}
            accessibilityRole="button"
            accessibilityLabel={`${role.code} ${role.name}`}
            onPress={() => router.push(`/access/roles/${role.code}`)}
            className="min-h-[52px] flex-row items-center gap-3 rounded-11 border border-line bg-panel px-3 py-2 active:bg-control-active"
          >
            <RoleChip role={role.code} />
            <View className="min-w-0 flex-1">
              <Text numberOfLines={1} className="font-medium text-[14px] text-text">
                {role.name}
              </Text>
              <Text className="font-regular text-[11.5px] text-dim">
                {t('access.rolePermissions', {
                  count: role.permissions.filter((p) => permissions.includes(p)).length,
                })}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

export function RolePermissionsScreen({ code }: { code: string }) {
  const { t } = useTranslation();
  const matrix = useRoleMatrix();
  const role = matrix.data?.find((r) => r.code === code);
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScreenHeader
        title={role ? `${role.code} · ${role.name}` : t('access.matrix')}
        fallback="/access/roles"
      />
      {role ? (
        <RoleEditor key={role.permissions.join(',')} role={role} />
      ) : (
        !matrix.isPending && (
          <Text className="p-4 font-regular text-[13px] text-dim">
            {t('access.matrixUnavailable')}
          </Text>
        )
      )}
    </SafeAreaView>
  );
}

function RoleEditor({ role }: { role: RoleInfo }) {
  const { t } = useTranslation();
  const palette = themes[useTheme().theme];
  const { can } = useCan();
  const save = useSaveRolePermissions();
  const editable = can('roles.assign');
  const [toggled, setToggled] = useState<Set<Permission>>(() => new Set());
  const has = (p: Permission) => role.permissions.includes(p) !== toggled.has(p);
  const permName = (p: Permission) => t(`access.permissionNames.${p}`);
  const toggle = (p: Permission) =>
    setToggled((prev) => {
      const next = new Set(prev);
      if (!next.delete(p)) next.add(p);
      return next;
    });

  const groups: { title: string; items: Permission[] }[] = [];
  for (const p of permissions) {
    const title = t(groupTitle[p.split('.')[0]] ?? 'access.permission');
    const last = groups.at(-1);
    if (last?.title === title) last.items.push(p);
    else groups.push({ title, items: [p] });
  }

  const confirm = () => {
    const changes = permissions
      .filter((p) => toggled.has(p))
      .map(
        (p) => `${has(p) ? t('access.matrixGrant') : t('access.matrixRevoke')} «${permName(p)}»`,
      );
    Alert.alert(
      t('access.matrixConfirmTitle'),
      `${t('access.matrixConfirmText')}\n\n${role.code}: ${changes.join(', ')}`,
      [
        { text: t('access.cancel'), style: 'cancel' },
        {
          text: t('access.matrixSave'),
          onPress: () =>
            save.mutate([{ code: role.code, permissions: permissions.filter(has) }], {
              onSuccess: () => setToggled(new Set()),
            }),
        },
      ],
    );
  };

  return (
    <>
      <ScrollView contentContainerClassName="gap-4 p-4 pb-28">
        {editable && (
          <Text className="font-regular text-[12px] leading-4 text-dim">
            {t('access.matrixEditHintMobile')}
          </Text>
        )}
        {groups.map((group) => (
          <View key={group.title} className="gap-1">
            <Text className={caps}>{group.title}</Text>
            <View className="rounded-11 border border-line bg-panel">
              {group.items.map((p, i) => (
                <View
                  key={p}
                  className={`min-h-11 flex-row items-center gap-3 px-3 py-2 ${
                    i > 0 ? 'border-t border-line' : ''
                  } ${toggled.has(p) ? 'bg-info-chip' : ''}`}
                >
                  <Text className="flex-1 font-regular text-[13px] text-text">{permName(p)}</Text>
                  {editable ? (
                    <Switch
                      accessibilityLabel={permName(p)}
                      value={has(p)}
                      onValueChange={() => toggle(p)}
                      trackColor={{ false: palette.control, true: palette.success }}
                    />
                  ) : (
                    <Text
                      accessibilityLabel={`${permName(p)}: ${has(p) ? '+' : '—'}`}
                      className={`font-semibold text-[13px] ${has(p) ? 'text-success' : 'text-dim'}`}
                    >
                      {has(p) ? '✓' : '—'}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
      {toggled.size > 0 && (
        <View className="absolute inset-x-4 bottom-6 flex-row items-center gap-2 rounded-14 border border-line bg-panel px-3 py-3">
          <Text className="flex-1 font-regular text-[13px] text-text">
            {t('access.matrixChanges', { count: toggled.size })}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setToggled(new Set())}
            className="h-9 items-center justify-center rounded-9 border border-line px-3"
          >
            <Text className="font-medium text-[13px] text-sub">{t('access.matrixReset')}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={save.isPending}
            onPress={confirm}
            className={`h-9 items-center justify-center rounded-9 bg-brand-red px-3 ${
              save.isPending ? 'opacity-50' : ''
            }`}
          >
            <Text className="font-semibold text-[13px] text-[#FFFFFF]">
              {t('access.matrixSave')}
            </Text>
          </Pressable>
        </View>
      )}
    </>
  );
}
