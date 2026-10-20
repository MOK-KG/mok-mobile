import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import type { ComponentType, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useCan, useSession, useSignOut } from '@/features/auth';
import { useUnreadCount } from '@/features/notifications/useUnreadCount';
import type { Language } from '@/shared/config/i18n';
import type { Section } from '@/shared/config/permissions';
import { themes } from '@/shared/config/tokens';
import { initials } from '@/shared/lib/text';
import { BellIcon, LogoutIcon } from '@/shared/ui/icons';
import { LanguageSwitcher } from '@/shared/ui/LanguageSwitcher';
import { sectionIcons } from '@/shared/ui/sectionIcons';
import { TabHeader } from '@/shared/ui/TabHeader';
import { ThemeSwitch } from '@/shared/ui/ThemeSwitch';

/** Разделы, которым не хватило места в нижней панели — порядок как в меню web */
const moreSections: Section[] = ['calendar', 'knowledge', 'files', 'access'];

type IconType = ComponentType<{ size?: number; color: string }>;

function Group({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      {title && (
        <Text className="px-1 font-semibold text-[10px] uppercase tracking-[1.4px] text-dim">
          {title}
        </Text>
      )}
      <View className="overflow-hidden rounded-14 border border-line bg-panel">{children}</View>
    </View>
  );
}

function Row({
  Icon,
  label,
  onPress,
  right,
  danger = false,
}: {
  Icon: IconType;
  label: string;
  onPress?: () => void;
  right?: ReactNode;
  danger?: boolean;
}) {
  const palette = themes[useTheme().theme];
  const content = (
    <>
      <Icon size={18} color={danger ? palette.danger : palette.sub} />
      <Text
        className={`flex-1 font-medium text-[14px] tracking-[-0.1px] ${danger ? 'text-danger' : 'text-text'}`}
      >
        {label}
      </Text>
      {right}
      {onPress && !danger && <ChevronRight size={16} color={palette.dim} />}
    </>
  );
  const row = 'min-h-[48px] flex-row items-center gap-3 border-b border-line px-4 last:border-b-0';
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={`${row} active:bg-row-highlight`}
    >
      {content}
    </Pressable>
  ) : (
    <View className={row}>{content}</View>
  );
}

/** Вкладка «Ещё»: профиль, остальные разделы, уведомления, язык и тема, выход */
export function MoreScreen() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const user = useSession().data?.user;
  const signOut = useSignOut();
  const { canOpen } = useCan();
  const unread = useUnreadCount();
  const allowed = moreSections.filter(canOpen);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <TabHeader title={t('shell.more')} />
      <ScrollView contentContainerClassName="gap-5 p-4">
        {user && (
          <View className="flex-row items-center gap-3 rounded-14 border border-line bg-panel p-4">
            <View className="size-11 items-center justify-center rounded-full bg-tone-blue-bg">
              <Text className="font-semibold text-[15px] text-tone-blue">
                {initials(user.name)}
              </Text>
            </View>
            <View className="min-w-0 flex-1">
              <Text className="font-semibold text-[15px] tracking-[-0.2px] text-text">
                {user.name}
              </Text>
              <Text numberOfLines={1} className="font-regular text-[12px] text-faint">
                {[user.position, user.department].filter(Boolean).join(' · ')}
              </Text>
              <Text numberOfLines={1} className="font-regular text-[12px] text-dim">
                {user.email}
              </Text>
            </View>
          </View>
        )}

        {allowed.length > 0 && (
          <Group title={t('home.sections')}>
            {allowed.map((s) => (
              <Row
                key={s}
                Icon={sectionIcons[s]}
                label={t(`sections.${s}`)}
                onPress={() => router.push(`/${s}`)}
              />
            ))}
          </Group>
        )}

        <Group>
          <Row
            Icon={BellIcon}
            label={t('shell.notifications')}
            onPress={() => router.push('/notifications')}
            right={
              unread > 0 && (
                <Text
                  accessibilityLabel={t('shell.unread', { count: unread })}
                  className="min-w-6 overflow-hidden rounded-6 bg-control px-[6px] py-[2px] text-center font-semibold text-[10.5px] text-sub"
                >
                  {unread}
                </Text>
              )
            }
          />
        </Group>

        <Group>
          <View className="min-h-[52px] flex-row items-center justify-between border-b border-line px-4">
            <Text className="font-medium text-[14px] text-text">{t('settings.language')}</Text>
            <LanguageSwitcher
              value={(i18n.resolvedLanguage ?? 'ru') as Language}
              onChange={(lng) => i18n.changeLanguage(lng)}
            />
          </View>
          <View className="min-h-[52px] flex-row items-center justify-between px-4">
            <Text className="font-medium text-[14px] text-text">{t('settings.theme')}</Text>
            <ThemeSwitch
              value={theme}
              onChange={setTheme}
              labels={{ dark: t('settings.dark'), light: t('settings.light') }}
            />
          </View>
        </Group>

        <Group>
          <Row
            Icon={LogoutIcon}
            label={t('auth.signOut')}
            danger
            onPress={() => signOut.mutate()}
          />
        </Group>
      </ScrollView>
    </SafeAreaView>
  );
}
