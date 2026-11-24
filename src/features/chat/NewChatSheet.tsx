import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal } from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useCurrentAbsences } from '@/features/absences/api';
import { useCurrentPersonId } from '@/features/auth';
import { Avatar } from '@/features/tasks/parts';
import { themes } from '@/shared/config/tokens';
import { GroupIcon, XIcon } from '@/shared/ui/icons';
import { Tooltip } from '@/shared/ui/Tooltip';
import { useChatMembers } from './api';
import { peerSubtitle } from './parts';
import type { ChatMember } from './types';

/** Шторка «Новая переписка»: выбор сотрудника для личной переписки */
export function NewChatSheet({
  sheetRef,
  onPick,
}: {
  sheetRef: RefObject<BottomSheetModal | null>;
  onPick: (memberId: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const palette = themes[useTheme().theme];
  const insets = useSafeAreaInsets();
  const members = useChatMembers();
  const me = useCurrentPersonId();
  const absences = useCurrentAbsences().data;
  const people: ChatMember[] = Object.values(members)
    .filter((m) => m.id !== me && m.active !== false)
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'));

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
            {t('chat.newChat')}
          </Text>
          <Text className="mt-1 font-regular text-[12px] leading-4 text-faint">
            {t('chat.pickPersonHint')}
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
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          sheetRef.current?.dismiss();
          router.push('/chat/group/new');
        }}
        className="mx-[11px] mb-1 h-[52px] flex-row items-center gap-3 rounded-9 px-2 active:bg-control-active"
      >
        <View className="size-[34px] items-center justify-center rounded-full bg-info-chip">
          <GroupIcon size={17} color={palette.info} />
        </View>
        <Text className="flex-1 font-medium text-[14px] text-info">{t('chat.newGroup')}</Text>
      </Pressable>
      <BottomSheetFlatList
        data={people}
        keyExtractor={(m: ChatMember) => m.id}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 14) }}
        renderItem={({ item }: { item: ChatMember }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${item.name}, ${t(`access.roles.${item.role}`)}`}
            onPress={() => {
              sheetRef.current?.dismiss();
              onPick(item.id);
            }}
            className="mx-[11px] h-[52px] flex-row items-center gap-3 rounded-9 px-2 active:bg-control-active"
          >
            <Avatar person={item} size={34} />
            <View className="min-w-0 flex-1">
              <Text numberOfLines={1} className="font-medium text-[14px] text-text">
                {item.name}
              </Text>
              <Text numberOfLines={1} className="font-regular text-[11.5px] text-dim">
                {peerSubtitle(item, t, i18n.language, false, absences)}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </BottomSheetModal>
  );
}
