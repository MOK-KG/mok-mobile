import { Languages, Moon, Sun } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/app/providers/ThemeProvider';
import { languageLabels, languages } from '@/shared/config/i18n';
import { themes } from '@/shared/config/tokens';
import { formatDate } from '@/shared/lib/date';

/** Временный стартовый экран для проверки темы и языка. Заменить на реальные экраны. */
export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const iconColor = themes[theme].sub;

  return (
    <SafeAreaView className="flex-1 gap-6 p-4">
      <View className="flex-row items-center justify-between gap-4 rounded-14 bg-panel p-4">
        <View className="flex-1 flex-row items-center gap-3">
          <View className="h-8 w-2 rounded-full bg-brand-red" />
          <Text className="flex-1 font-semibold text-text">{t('app.title')}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={toggleTheme}
          className="flex-row items-center gap-2 rounded-9 bg-surface px-3 py-2"
        >
          {theme === 'dark' ? (
            <Moon size={16} color={iconColor} />
          ) : (
            <Sun size={16} color={iconColor} />
          )}
          <Text className="font-medium text-text">
            {t(theme === 'dark' ? 'settings.dark' : 'settings.light')}
          </Text>
        </Pressable>
      </View>

      <View className="flex-row items-center gap-2">
        <Languages size={16} color={iconColor} />
        {languages.map((lng) => {
          const active = i18n.resolvedLanguage === lng;
          return (
            <Pressable
              key={lng}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => i18n.changeLanguage(lng)}
              className={`rounded-8 px-3 py-2 ${active ? 'bg-brand-red' : 'bg-surface'}`}
            >
              <Text className={active ? 'font-medium text-[#FFFFFF]' : 'font-sans text-sub'}>
                {languageLabels[lng]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="gap-2 rounded-18 bg-card p-6">
        <Text className="text-lg font-medium text-text">{t('demo.greeting')}</Text>
        <Text className="font-sans text-sub">
          {t('demo.today', { date: formatDate(new Date(), 'd MMMM yyyy', i18n.language) })}
        </Text>
        <View className="mt-4 flex-row flex-wrap gap-2">
          <Text className="rounded-6 bg-surface px-2 py-1 font-sans text-success">success</Text>
          <Text className="rounded-6 bg-surface px-2 py-1 font-sans text-warning">warning</Text>
          <Text className="rounded-6 bg-surface px-2 py-1 font-sans text-danger">danger</Text>
          <Text className="rounded-6 bg-surface px-2 py-1 font-sans text-info">info</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
