import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal } from '@gorhom/bottom-sheet';
import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useKnowledge } from '@/features/knowledge-base/api';
import { themes } from '@/shared/config/tokens';
import { BookIcon, XIcon } from '@/shared/ui/icons';
import { Tooltip } from '@/shared/ui/Tooltip';

type Picked = { id: string; title: string; summary: string };

export function ArticlePickerSheet({
  sheetRef,
  onPick,
}: {
  sheetRef: RefObject<BottomSheetModal | null>;
  onPick: (article: { id: string; title: string }) => void;
}) {
  const { t } = useTranslation();
  const palette = themes[useTheme().theme];
  const insets = useSafeAreaInsets();
  const articles: Picked[] = useKnowledge().data?.articles ?? [];

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
      <View className="flex-row items-center gap-3 px-[19px] pb-3 pt-2">
        <Text
          accessibilityRole="header"
          className="flex-1 font-semibold text-[17px] tracking-[-0.3px] text-text"
        >
          {t('chat.attachArticle')}
        </Text>
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
        data={articles}
        keyExtractor={(x: Picked) => x.id}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 14) }}
        ListEmptyComponent={
          <Text className="py-8 text-center font-regular text-[13px] text-dim">
            {t('chat.noArticles')}
          </Text>
        }
        renderItem={({ item }: { item: Picked }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={item.title}
            onPress={() => {
              sheetRef.current?.dismiss();
              onPick({ id: item.id, title: item.title });
            }}
            className="mx-[11px] min-h-[52px] flex-row items-center gap-3 rounded-9 px-2 py-2 active:bg-control-active"
          >
            <BookIcon size={16} color={palette['tone-violet']} />
            <View className="min-w-0 flex-1">
              <Text numberOfLines={1} className="font-medium text-[14px] text-text">
                {item.title}
              </Text>
              {!!item.summary && (
                <Text numberOfLines={1} className="font-regular text-[11.5px] text-dim">
                  {item.summary}
                </Text>
              )}
            </View>
          </Pressable>
        )}
      />
    </BottomSheetModal>
  );
}
