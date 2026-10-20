import { type Href, router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import { themes } from '@/shared/config/tokens';

type Props = {
  title?: string;
  /** Содержимое справа от заголовка: код задачи, действия */
  right?: ReactNode;
  /** Куда вернуться, если экран открыт по прямой ссылке и истории нет */
  fallback?: Href;
};

/** Шапка вложенного экрана: «назад», заголовок, действие справа */
export function ScreenHeader({ title, right, fallback = '/' }: Props) {
  const { t } = useTranslation();
  const palette = themes[useTheme().theme];
  return (
    <View className="h-[52px] flex-row items-center gap-2 border-b border-line bg-panel px-3">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('shell.back')}
        onPress={() => (router.canGoBack() ? router.back() : router.replace(fallback))}
        hitSlop={8}
        className="size-8 items-center justify-center rounded-8"
      >
        <ChevronLeft size={20} color={palette.sub} />
      </Pressable>
      <Text
        accessibilityRole="header"
        numberOfLines={1}
        className="flex-1 font-semibold text-[16px] tracking-[-0.3px] text-text"
      >
        {title}
      </Text>
      {right}
    </View>
  );
}
