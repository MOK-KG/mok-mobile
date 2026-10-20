import { Tabs } from 'expo-router';
import type { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { type ColorValue, View } from 'react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useCan } from '@/features/auth';
import { useUnreadCount } from '@/features/notifications/useUnreadCount';
import type { Section } from '@/shared/config/permissions';
import { themes } from '@/shared/config/tokens';
import { MoreIcon } from '@/shared/ui/icons';
import { sectionIcons } from '@/shared/ui/sectionIcons';

type IconType = ComponentType<{ size?: number; color: string }>;

/**
 * Иконка вкладки; у активной — красная метка сверху, как полоса у пункта меню в web.
 * Непрочитанное — точка на иконке, как у колокольчика в web; само число — внутри «Ещё»
 */
const tabIcon =
  (Icon: IconType, dot = false) =>
  ({ color, focused }: { color: ColorValue; focused: boolean }) => (
    <View className="items-center">
      <View
        className={`absolute -top-[7px] h-[3px] w-5 rounded-full ${focused ? 'bg-brand-red' : ''}`}
      />
      {/* Цвет вкладки задаём строками из токенов (tabBar*TintColor) */}
      <Icon size={22} color={color as string} />
      {dot && (
        <View className="absolute -right-[2px] top-0 size-[8px] rounded-full border-[1.5px] border-panel bg-brand-red" />
      )}
    </View>
  );

/**
 * Нижние вкладки: основные разделы всегда в одно касание. Раздел без права скрыт из панели,
 * а по прямой ссылке открывается экран 403 (RequirePermission в самом экране).
 * Остальные разделы, уведомления, профиль и настройки — во вкладке «Ещё».
 */
export default function TabsLayout() {
  const { t } = useTranslation();
  const palette = themes[useTheme().theme];
  const { canOpen } = useCan();
  const unread = useUnreadCount();

  // Счётчиков у чата и документов пока нет: разделы — заглушки, и число не совпало бы
  // с содержимым. Появятся вместе с разделами
  const section = (name: Section) => ({
    title: t(`sections.${name}`),
    tabBarIcon: tabIcon(sectionIcons[name]),
    href: canOpen(name) ? undefined : null,
  });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: 'transparent' },
        tabBarActiveTintColor: palette.text,
        tabBarInactiveTintColor: palette.dim,
        tabBarStyle: { backgroundColor: palette.panel, borderTopColor: palette.line },
        tabBarLabelStyle: { fontFamily: 'Inter_500Medium', fontSize: 10, letterSpacing: -0.1 },
      }}
    >
      <Tabs.Screen name="index" options={section('dashboard')} />
      <Tabs.Screen name="tasks" options={section('tasks')} />
      <Tabs.Screen name="chat" options={section('chat')} />
      <Tabs.Screen name="documents" options={section('documents')} />
      <Tabs.Screen
        name="more"
        options={{
          title: t('shell.more'),
          tabBarIcon: tabIcon(MoreIcon, unread > 0),
          tabBarAccessibilityLabel: unread
            ? `${t('shell.more')}, ${t('shell.unread', { count: unread })}`
            : undefined,
        }}
      />
    </Tabs>
  );
}
