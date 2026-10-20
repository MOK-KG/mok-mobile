import { type ComponentType, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, Pressable, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/app/providers/ThemeProvider';
import { type ThemeColorName, themes } from '@/shared/config/tokens';
import { type Toast, type ToastTone, toast as toastApi, useToasts } from '@/shared/lib/toast';
import { AlertMiniIcon, BellSmallIcon, CheckSmallIcon, XIcon } from './icons';

const tones: Record<
  ToastTone,
  { Icon: ComponentType<{ size?: number; color: string }>; stripe: string; color: ThemeColorName }
> = {
  success: { Icon: CheckSmallIcon, stripe: 'bg-success', color: 'success' },
  error: { Icon: AlertMiniIcon, stripe: 'bg-brand-red', color: 'danger' },
  warning: { Icon: AlertMiniIcon, stripe: 'bg-warning', color: 'warning' },
  info: { Icon: BellSmallIcon, stripe: 'bg-info', color: 'info' },
};

const HEADER_HEIGHT = 52;

/**
 * Тосты сверху экрана, под шапкой. Подключён один раз в AppProviders;
 * показывать — через toast.success(...) / toast.error(...) из shared/lib/toast или meta мутации.
 * Нажатие на тост закрывает его.
 */
export function Toaster() {
  const toasts = useToasts();
  const insets = useSafeAreaInsets();
  const announced = useRef(new Set<number>());

  // VoiceOver не следит за живыми областями — новый тост зачитываем явно
  useEffect(() => {
    for (const item of toasts) {
      if (announced.current.has(item.id)) continue;
      announced.current.add(item.id);
      AccessibilityInfo.announceForAccessibility(
        [item.title, item.text].filter(Boolean).join('. '),
      );
    }
  }, [toasts]);

  return (
    <View
      pointerEvents="box-none"
      // Под шапкой экрана (52 pt): «назад» и действия в шапке остаются доступны
      style={{ top: insets.top + HEADER_HEIGHT + 8 }}
      className="absolute left-3 right-3 gap-2"
    >
      {toasts.map((item) => (
        <ToastItem key={item.id} toast={item} />
      ))}
    </View>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const { t } = useTranslation();
  const palette = themes[useTheme().theme];
  const tone = tones[toast.tone];
  return (
    <Animated.View
      entering={FadeInUp.duration(180)}
      exiting={FadeOutUp.duration(150)}
      layout={LinearTransition.duration(150)}
      accessibilityLiveRegion={toast.tone === 'error' ? 'assertive' : 'polite'}
      style={{
        shadowColor: '#000000',
        shadowOpacity: 0.3,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: 8,
      }}
    >
      <Pressable
        accessibilityRole={toast.tone === 'error' ? 'alert' : 'summary'}
        accessibilityHint={t('toast.close')}
        onPress={() => toastApi.dismiss(toast.id)}
        className="relative flex-row items-start gap-[10px] overflow-hidden rounded-12 border border-line bg-popover py-3 pl-[15px] pr-[10px]"
      >
        <View className={`absolute bottom-0 left-0 top-0 w-[3px] ${tone.stripe}`} />
        <View className="mt-px">
          <tone.Icon size={16} color={palette[tone.color]} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="font-medium text-[13px] leading-[18px] tracking-[-0.1px] text-text">
            {toast.title}
          </Text>
          {toast.text && (
            <Text className="mt-[2px] font-regular text-[11.5px] leading-4 text-faint">
              {toast.text}
            </Text>
          )}
          {toast.action && (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                toast.action?.onPress();
                toastApi.dismiss(toast.id);
              }}
              hitSlop={6}
              className="mt-[6px] self-start"
            >
              <Text className="font-semibold text-[12.5px] text-info">{toast.action.label}</Text>
            </Pressable>
          )}
        </View>
        <View className="size-6 items-center justify-center">
          <XIcon size={14} color={palette.faint} />
        </View>
      </Pressable>
    </Animated.View>
  );
}
