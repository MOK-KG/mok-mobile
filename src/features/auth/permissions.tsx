import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type Permission, type Section, sections } from '@/shared/config/permissions';
import { useSession } from './useSession';

/**
 * Проверка прав текущего пользователя. Права приходят в сессии с бэкенда,
 * поэтому смена роли применяется сразу после обновления сессии.
 */
export function useCan() {
  const session = useSession();
  const granted = new Set(session.data?.status === 'active' ? session.data.user.permissions : []);
  const isActive = session.data?.status === 'active';
  const can = (permission: Permission | null) =>
    permission === null ? isActive : granted.has(permission);
  return {
    can,
    canAny: (list: Permission[]) => list.some((p) => granted.has(p)),
    /** Открыт ли раздел меню */
    canOpen: (section: Section) => can(sections[section]),
  };
}

/** Показывает детей только при наличии права. Для кнопок и пунктов меню */
export function Can({
  permission,
  children,
  fallback = null,
}: {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { can } = useCan();
  return can(permission) ? children : fallback;
}

/**
 * Охрана экрана по праву. Без права — экран «Нет доступа» (403),
 * а не пустой список и не тихий редирект (блокирующая проверка приёмки).
 */
export function RequirePermission({
  permission,
  children,
}: {
  /** null — достаточно активной роли */
  permission: Permission | null;
  children: ReactNode;
}) {
  const { can } = useCan();
  return can(permission) ? children : <ForbiddenScreen />;
}

export function ForbiddenScreen() {
  const { t } = useTranslation();
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-canvas p-6">
      <View
        accessibilityRole="alert"
        className="w-full items-center rounded-18 border border-line bg-panel p-8"
      >
        <Text className="font-semibold text-[13px] tracking-[1.5px] text-danger">403</Text>
        <Text className="mt-3 text-center font-bold text-[24px] tracking-[-0.5px] text-text">
          {t('forbidden.title')}
        </Text>
        <Text className="mt-3 text-center font-regular text-[14px] leading-[22px] text-sub">
          {t('forbidden.text')}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/')}
          className="mt-6 rounded-11 bg-surface px-4 py-2 active:opacity-80"
        >
          <Text className="font-medium text-text">{t('forbidden.home')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
