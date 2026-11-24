import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal } from '@gorhom/bottom-sheet';
import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/app/providers/ThemeProvider';
import { themes } from '@/shared/config/tokens';
import { ChatIcon, GroupIcon, XIcon } from '@/shared/ui/icons';
import { Tooltip } from '@/shared/ui/Tooltip';
import { useChats } from './api';
import type { Chat } from './types';

const order = { channel: 0, group: 1, direct: 2 } as const;

export function ChatPickerSheet({
  sheetRef,
  onPick,
}: {
  sheetRef: RefObject<BottomSheetModal | null>;
  onPick: (chat: Chat) => void;
}) {
  const { t } = useTranslation();
  const palette = themes[useTheme().theme];
  const insets = useSafeAreaInsets();
  const chats = [...(useChats().data ?? [])].sort((a, b) => order[a.kind] - order[b.kind]);

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={['75%']}
      enableDynamicSizing={false}
      backdropComponent={(p) => (
        <BottomSheetBackdrop {...p} appearsOnIndex={0} disappearsOnIndex={-1} />
      )}
      backgroundStyle={{ backgroundColor: palette.surface, borderRadius: 20 }}
      handleIndicatorStyle={{ backgroundColor: palette.dim, width: 36 }}
    >
      <View className="flex-row items-start gap-3 px-[19px] pb-3 pt-2">
        <View className="flex-1">
          <Text
            accessibilityRole="header"
            className="font-semibold text-[17px] tracking-[-0.3px] text-text"
          >
            {t('chat.discussTitle')}
          </Text>
          <Text className="mt-1 font-regular text-[12px] leading-4 text-faint">
            {t('chat.discussHint')}
          </Text>
        </View>
        <Tooltip content={t('chat.close')}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('chat.close')}
            onPress={() => sheetRef.current?.dismiss()}
            hitSlop={8}
            className="size-7 items-center justify-center rounded-[7px]"
          >
            <XIcon size={16} color={palette.faint} />
          </Pressable>
        </Tooltip>
      </View>
      <BottomSheetFlatList
        data={chats}
        keyExtractor={(c: Chat) => c.id}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 14) }}
        ListEmptyComponent={
          <Text className="py-8 text-center font-regular text-[13px] text-dim">
            {t('chat.noChats')}
          </Text>
        }
        renderItem={({ item }: { item: Chat }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={item.title}
            onPress={() => {
              sheetRef.current?.dismiss();
              onPick(item);
            }}
            className="mx-[11px] min-h-[52px] flex-row items-center gap-3 rounded-9 px-2 py-2 active:bg-control-active"
          >
            {item.kind === 'direct' ? (
              <ChatIcon size={16} color={palette.faint} />
            ) : (
              <GroupIcon size={16} color={palette.info} />
            )}
            <View className="min-w-0 flex-1">
              <Text numberOfLines={1} className="font-medium text-[14px] text-text">
                {item.title}
              </Text>
              <Text numberOfLines={1} className="font-regular text-[11.5px] text-dim">
                {t(`chat.kind.${item.kind}`)}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </BottomSheetModal>
  );
}
