import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

/** Шапка экрана-вкладки: заголовок раздела и действия справа (без «назад») */
export function TabHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View className="h-[52px] flex-row items-center gap-2 border-b border-line bg-panel px-4">
      <Text
        accessibilityRole="header"
        numberOfLines={1}
        className="flex-1 font-semibold text-[17px] tracking-[-0.3px] text-text"
      >
        {title}
      </Text>
      {right}
    </View>
  );
}
