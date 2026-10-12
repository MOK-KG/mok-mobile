import { useTranslation } from 'react-i18next';
import { Linking, Pressable, Text, View } from 'react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { links } from '@/shared/config/links';
import { Banner } from '@/shared/ui/Banner';
import { GoogleButton } from '@/shared/ui/GoogleButton';
import { AuthScreen, SheetTitle } from './AuthScreen';
import { useSignIn } from './useSession';

/**
 * Экран входа. Состояния из макета:
 * 1 — вход, 2 — переход в Google, 3 — отказ в доступе (чужой домен).
 * Состояние 4 «ожидает активации» — отдельный экран PendingScreen.
 */
export function LoginScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const signIn = useSignIn();
  const redirecting = signIn.isPending;
  const result = signIn.data;
  const error = !redirecting && result && !result.ok && 'error' in result ? result.error : null;

  if (error) {
    return (
      <AuthScreen footerNote={t('auth.deniedFooterShort')}>
        <SheetTitle>{t('auth.title')}</SheetTitle>
        <View className="mt-[11px]">
          <Banner
            tone="danger"
            title={t('auth.deniedTitle')}
            text={
              error.code === 'forbidden_domain'
                ? t('auth.deniedText', { email: error.email })
                : t('auth.genericError')
            }
          />
        </View>
        <View className="mt-5">
          <GoogleButton
            theme={theme}
            label={t('auth.signInWithAnother')}
            onPress={() => signIn.mutate()}
          />
        </View>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen footerNote={t('auth.noAccess')}>
      <SheetTitle>{t('auth.title')}</SheetTitle>
      <Text
        accessibilityLiveRegion="polite"
        className="mt-[6px] font-regular text-[13px] leading-5 text-sub"
      >
        {redirecting ? t('auth.redirecting') : t('auth.subtitleShort')}
      </Text>

      <View className="mt-6">
        <GoogleButton
          theme={theme}
          loading={redirecting}
          label={redirecting ? t('auth.openingGoogle') : t('auth.continueWithGoogle')}
          onPress={() => signIn.mutate()}
        />
      </View>

      {signIn.isError && (
        <Text accessibilityRole="alert" className="mt-3 font-regular text-[12px] text-danger">
          {t('auth.genericError')}
        </Text>
      )}

      {redirecting ? (
        <Text className="mt-5 font-regular text-[12px] leading-[19px] text-faint">
          {t('auth.popupHint')}
        </Text>
      ) : (
        <>
          <View className="mt-7 h-px bg-line" />
          <Text className="mt-6 font-semibold text-[13.5px] tracking-[-0.1px] text-text">
            {t('auth.forgotTitle')}
          </Text>
          <Text className="mt-2 font-regular text-[12px] leading-[19px] text-sub">
            {t('auth.forgotTextShort')}
          </Text>
          <Pressable
            accessibilityRole="link"
            onPress={() => Linking.openURL(links.googleWorkspace)}
            hitSlop={8}
          >
            <Text className="mt-2 font-medium text-[12px] text-info">
              {t('auth.openWorkspace')} →
            </Text>
          </Pressable>
        </>
      )}
    </AuthScreen>
  );
}
