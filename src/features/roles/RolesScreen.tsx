import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/app/providers/ThemeProvider';
import { type RoleCode, roleCodes } from '@/shared/config/permissions';
import { themes } from '@/shared/config/tokens';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import { useStaff } from './api';
import { RoleChip, StaffAvatar, StatusBadge } from './parts';

/**
 * «Роли и доступ» (из вкладки «Ещё»): сотрудники, поиск и фильтр по роли. Карточка —
 * смена роли и увольнение. Приглашение и журнал действий — на вебе.
 */
export function RolesScreen() {
  const { t } = useTranslation();
  const palette = themes[useTheme().theme];
  const staff = useStaff();
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<RoleCode | null>(null);
  const rows = staff.data ?? [];
  const needle = query.trim().toLocaleLowerCase('ru');
  const matches = (r: (typeof rows)[number]) =>
    !needle ||
    [r.name, r.email, r.position, t(`access.roles.${r.role}`)].some((v) =>
      v?.toLocaleLowerCase('ru').includes(needle),
    );
  const shown = rows.filter((r) => (!role || r.role === role) && matches(r));

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScreenHeader title={t('sections.access')} fallback="/more" />
      <View className="px-4 pt-1">
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('access.search')}
          placeholderTextColor={palette.dim}
          accessibilityLabel={t('access.search')}
          className="h-10 rounded-9 border border-line bg-panel px-3 font-regular text-[13.5px] text-text"
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="max-h-12 grow-0"
        contentContainerClassName="items-center gap-[7px] px-4 py-[10px]"
      >
        {[null, ...roleCodes].map((r) => {
          const active = r === role;
          const count = rows.filter((x) => (!r || x.role === r) && matches(x)).length;
          if (r && count === 0 && !active) return null;
          return (
            <Pressable
              key={r ?? 'all'}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              accessibilityLabel={r ? t(`access.roles.${r}`) : t('files.all')}
              onPress={() => setRole(r)}
              className={`h-7 flex-row items-center gap-[6px] rounded-8 border px-[9px] ${
                active ? 'border-transparent bg-control-active' : 'border-line bg-panel'
              }`}
            >
              <Text
                className={`text-[12px] ${active ? 'font-semibold text-text' : 'font-regular text-sub'}`}
              >
                {r ?? t('files.all')}
              </Text>
              <Text
                className={`font-medium text-[10.5px] ${active ? 'text-tone-gold' : 'text-dim'}`}
              >
                {count}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <FlashList
        data={shown}
        keyExtractor={(r) => r.id}
        renderItem={({ item: r }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${r.name ?? r.position} · ${t(`access.roles.${r.role}`)}`}
            onPress={() => router.push(`/access/${r.id}`)}
            className="flex-row items-center gap-3 bg-panel px-4 py-3 active:bg-row-highlight"
          >
            <StaffAvatar name={r.name} tone={r.tone} size={36} />
            <View className="min-w-0 flex-1 gap-[3px]">
              <Text numberOfLines={1} className="font-regular text-[14px] text-text">
                {r.name ?? t('access.vacant')}
                {r.isMe && <Text className="text-faint"> · {t('access.you')}</Text>}
              </Text>
              <Text numberOfLines={1} className="font-regular text-[12px] text-sub">
                {r.position}
              </Text>
            </View>
            <View className="items-end gap-1">
              <RoleChip role={r.role} />
              <StatusBadge badge={r.badge} />
            </View>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View className="h-px bg-line" />}
        ListEmptyComponent={
          staff.isPending ? null : (
            <Text className="px-6 py-10 text-center font-regular text-[13px] text-dim">
              {t('access.nothingFound')}
            </Text>
          )
        }
      />
    </SafeAreaView>
  );
}
