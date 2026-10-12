import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCan, useSession, useSignOut } from '@/features/auth';
import { type Section, sections } from '@/shared/config/permissions';

/** Временная главная: разделы, доступные роли пользователя. Остальные не показываются */
export default function HomeScreen() {
  const { t } = useTranslation();
  const session = useSession();
  const signOut = useSignOut();
  const { canOpen } = useCan();
  const user = session.data?.user;
  // Рабочий стол — это сам этот экран
  const allowed = (Object.keys(sections) as Section[]).filter(
    (s) => s !== 'dashboard' && canOpen(s),
  );

  return (
    <SafeAreaView className="flex-1 gap-4 bg-canvas p-4">
      <View className="flex-row items-center justify-between gap-4 rounded-14 bg-panel p-4">
        <Text className="flex-1 font-semibold text-text">{t('app.title')}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => signOut.mutate()}
          className="rounded-9 bg-surface px-3 py-2"
        >
          <Text className="font-medium text-sub">{t('auth.signOut')}</Text>
        </Pressable>
      </View>
      <View className="gap-2 rounded-18 bg-card p-6">
        <Text className="font-medium text-lg text-text">
          {t('home.greeting', { name: user?.name })}
        </Text>
        <Text className="font-regular text-[13px] text-faint">
          {t('home.roles', { roles: user?.roles.join(', ') })}
        </Text>
        {allowed.length > 0 ? (
          <View accessibilityLabel={t('home.sections')} className="mt-3 gap-2">
            {allowed.map((section) => (
              <Link key={section} href={`/${section}`} asChild>
                <Pressable className="rounded-12 border border-line bg-surface px-4 py-3 active:opacity-80">
                  <Text className="font-medium text-text">{t(`sections.${section}`)}</Text>
                </Pressable>
              </Link>
            ))}
          </View>
        ) : (
          <Text className="mt-3 font-regular text-sub">{t('home.noSections')}</Text>
        )}
      </View>
    </SafeAreaView>
  );
}
