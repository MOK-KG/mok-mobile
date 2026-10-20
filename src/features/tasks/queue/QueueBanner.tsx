import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { ArrowRightIcon, MailLargeIcon } from '@/shared/ui/icons';
import { useMailQueueSummary } from '../api';
import { usePalette } from '../parts';

/** Полоса очереди из почты над списком задач (макет Figma: «Очередь из почты») */
export function QueueBanner() {
  const { t } = useTranslation();
  const palette = usePalette();
  const { data } = useMailQueueSummary();
  if (!data || data.ready + data.manual === 0) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={t('tasks.queueOpen')}
      onPress={() => router.push('/tasks/queue')}
      className="relative mx-4 mb-[10px] flex-row items-center gap-[10px] overflow-hidden rounded-12 border border-warning-line bg-warning-soft py-[9px] pl-[15px] pr-3 active:opacity-80"
    >
      <View className="absolute bottom-0 left-0 top-0 w-[3px] bg-warning" />
      <MailLargeIcon size={18} color={palette['warning-text']} />
      <View className="min-w-0 flex-1">
        <Text className="font-semibold text-[12.5px] tracking-[-0.1px] text-warning-text">
          {t('tasks.queueTitle', { ready: data.ready, manual: data.manual })}
        </Text>
        <Text numberOfLines={1} className="mt-[1px] font-regular text-[11px] text-sub">
          {t('tasks.queueText')}
        </Text>
      </View>
      <ArrowRightIcon size={14} color={palette['warning-text']} />
    </Pressable>
  );
}
