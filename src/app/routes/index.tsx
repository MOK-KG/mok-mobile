import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession, useSignOut } from '@/features/auth';

/** Временная главная: появится вместе с разделами платформы */
export default function HomeScreen() {
  const { t } = useTranslation();
  const session = useSession();
  const signOut = useSignOut();

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
          {t('home.greeting', { name: session.data?.user.name })}
        </Text>
        <Text className="font-regular text-sub">{t('home.placeholder')}</Text>
      </View>
    </SafeAreaView>
  );
}
