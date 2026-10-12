import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/app/providers/ThemeProvider';
import type { Language } from '@/shared/config/i18n';
import { links } from '@/shared/config/links';
import { brand, themes } from '@/shared/config/tokens';
import { Glow } from '@/shared/ui/Glow';
import { LanguageSwitcher } from '@/shared/ui/LanguageSwitcher';
import { OlympicRings } from '@/shared/ui/OlympicRings';
import { ThemeSwitch } from '@/shared/ui/ThemeSwitch';

// Свечения из макета: цвет и непрозрачность центра для каждой темы
const glows = {
  dark: { red: 0.16, blue: 0.1 },
  light: { red: 0.08, blue: 0.05 },
};

/** Центры диагональных линий из макета (x, px) */
const lineCenters = [-34, 84, 202, 320];

type Props = {
  children: ReactNode;
  /** Подпись над ссылкой «Написать администратору» */
  footerNote: string;
  /** Дополнительное действие под футером (например, «Выйти») */
  footerExtra?: ReactNode;
};

/** Экран авторизации на мобильном: бренд сверху, форма в нижней панели (макет 390×844) */
export function AuthScreen({ children, footerNote, footerExtra }: Props) {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-canvas">
      <View pointerEvents="none" className="absolute inset-0 overflow-hidden">
        {lineCenters.map((x) => (
          <View
            key={x}
            className="absolute bg-text opacity-[0.04]"
            style={{ left: x, top: -87, width: 1.5, height: 620, transform: [{ rotate: '12deg' }] }}
          />
        ))}
        <Glow
          color={brand['brand-red']}
          opacity={glows[theme].red}
          size={700}
          left={-270}
          top={-90}
        />
        <Glow
          color={themes.light.info}
          opacity={glows[theme].blue}
          size={640}
          left={20}
          top={-220}
        />
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6" style={{ paddingTop: insets.top + 4 }}>
          <View className="flex-row justify-end gap-[10px]">
            <LanguageSwitcher
              value={(i18n.resolvedLanguage ?? 'ru') as Language}
              onChange={(lng) => i18n.changeLanguage(lng)}
            />
            <ThemeSwitch
              value={theme}
              onChange={setTheme}
              labels={{ dark: t('settings.dark'), light: t('settings.light') }}
            />
          </View>

          <View className="mt-[38px]">
            <OlympicRings theme={theme} />
          </View>
          <Text className="mt-[22px] font-semibold text-[9.5px] tracking-[1.5px] text-faint">
            {t('auth.orgName')}
          </Text>
          <View className="mt-[30px] h-[3px] w-10 rounded-full bg-brand-red" />
          <Text className="mt-[17px] font-bold text-[30px] leading-[38px] tracking-[-0.9px] text-text">
            {t('auth.headline1')}
            {'\n'}
            {t('auth.headline2')}
          </Text>
          <Text className="mt-2 max-w-[200px] font-regular text-[13.5px] leading-[21px] text-sub">
            {t('auth.taglineShort')}
          </Text>
        </View>

        <View className="min-h-10 flex-1" />
        <View
          className="rounded-t-24 border border-b-0 border-line bg-panel px-[23px] pt-[11px]"
          style={{
            paddingBottom: Math.max(insets.bottom, 16) + 8,
            shadowColor: '#000',
            shadowOpacity: theme === 'dark' ? 0.4 : 0.1,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: -8 },
          }}
        >
          <View className="h-1 w-9 self-center rounded-full bg-text opacity-[0.18]" />
          <View className="mt-7">{children}</View>

          <View className="mt-7 h-px bg-line" />
          <Text className="mt-[21px] font-regular text-[11.5px] tracking-[0.1px] text-faint">
            {footerNote}
          </Text>
          <Pressable
            accessibilityRole="link"
            onPress={() => Linking.openURL(links.contactAdmin)}
            hitSlop={8}
          >
            <Text className="mt-[5px] font-medium text-[11.5px] tracking-[0.1px] text-brand-red">
              {t('auth.contactAdmin')}
            </Text>
          </Pressable>
          {footerExtra}
        </View>
      </ScrollView>
    </View>
  );
}

/** Заголовок нижней панели */
export function SheetTitle({ children }: { children: string }) {
  return (
    <Text accessibilityRole="header" className="font-bold text-[24px] tracking-[-0.6px] text-text">
      {children}
    </Text>
  );
}
