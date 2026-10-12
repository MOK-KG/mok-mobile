import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

type Props = {
  tone: 'danger' | 'warning';
  title: string;
  text: string;
  /** Действие под разделителем, например «Обновить статус» */
  action?: ReactNode;
};

const tones = {
  danger: {
    box: 'bg-danger-soft border-danger-line',
    stripe: 'bg-brand-red',
    title: 'text-danger',
  },
  warning: {
    box: 'bg-warning-soft border-warning-line',
    stripe: 'bg-brand-gold',
    title: 'text-warning',
  },
} as const;

/** Баннер с цветной полосой слева: ошибка входа, ожидание активации */
export function Banner({ tone, title, text, action }: Props) {
  const t = tones[tone];
  return (
    <View
      accessibilityRole={tone === 'danger' ? 'alert' : 'summary'}
      className={`overflow-hidden rounded-12 border px-[19px] pb-[14px] pt-4 ${t.box}`}
    >
      <View className={`absolute bottom-0 left-0 top-0 w-[3px] ${t.stripe}`} />
      <Text className={`font-semibold text-[13px] tracking-[-0.1px] ${t.title}`}>{title}</Text>
      <Text className="mt-[6px] font-regular text-[11.5px] leading-[18px] text-sub">{text}</Text>
      {action && <View className="mt-[10px] border-t border-line pt-2">{action}</View>}
    </View>
  );
}
