import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { Banner } from '@/shared/ui/Banner';
import { AuthScreen, SheetTitle } from './AuthScreen';
import { useSession, useSignOut } from './useSession';

/** Состояние 4 из макета: вошёл через Google, но роль ещё не назначена */
export function PendingScreen() {
  const { t } = useTranslation();
  const session = useSession();
  const signOut = useSignOut();
  const email = session.data?.user.email ?? '';

  return (
    <AuthScreen
      footerNote={t('auth.urgentAccess')}
      footerExtra={
        <Pressable accessibilityRole="button" onPress={() => signOut.mutate()} hitSlop={8}>
          <Text className="mt-4 font-medium text-[11.5px] text-sub">{t('auth.signOut')}</Text>
        </Pressable>
      }
    >
      <SheetTitle>{t('auth.pendingTitle')}</SheetTitle>
      <Text className="mt-[6px] font-regular text-[12.5px] leading-5 text-sub">
        {t('auth.signedInAs', { email })}
      </Text>
      <View className="mt-4">
        <Banner
          tone="warning"
          title={t('auth.pendingBannerTitle')}
          text={t('auth.pendingBannerTextShort')}
          action={
            <Pressable
              accessibilityRole="button"
              disabled={session.isFetching}
              onPress={() => session.refetch()}
              hitSlop={8}
            >
              <Text className="font-medium text-[11.5px] text-info">{t('auth.refreshStatus')}</Text>
            </Pressable>
          }
        />
      </View>
    </AuthScreen>
  );
}
