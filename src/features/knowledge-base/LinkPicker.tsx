import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/app/providers/ThemeProvider';
import { themes } from '@/shared/config/tokens';
import { ChevronSmallIcon, PlusSmallIcon, XIcon } from '@/shared/ui/icons';
import { Tooltip } from '@/shared/ui/Tooltip';

export type LinkOption = { value: string; label: string; hint?: string };

/**
 * «Связать…» в редакторе статьи: поле открывает шторку со списком, выбор добавляет пункт
 * и закрывает шторку. Если связывать нечего — поле неактивно и пишет «Всё уже связано».
 */
export function LinkPicker({
  placeholder,
  empty,
  options,
  onPick,
}: {
  placeholder: string;
  empty: string;
  options: LinkOption[];
  onPick: (value: string) => void;
}) {
  const { t } = useTranslation();
  const palette = themes[useTheme().theme];
  const insets = useSafeAreaInsets();
  const sheet = useRef<BottomSheetModal>(null);
  const disabled = options.length === 0;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={disabled ? empty : placeholder}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => sheet.current?.present()}
        className={`mt-2 h-10 flex-row items-center gap-2 rounded-8 border border-line bg-column px-[13px] active:opacity-80 ${
          disabled ? 'opacity-60' : ''
        }`}
      >
        <PlusSmallIcon size={12} color={palette.sub} />
        <Text className="flex-1 font-regular text-[12.5px] text-sub">
          {disabled ? empty : placeholder}
        </Text>
        <ChevronSmallIcon size={14} color={palette.faint} />
      </Pressable>

      <BottomSheetModal
        ref={sheet}
        // По умолчанию шторка — один элемент для диктора, и пункты внутри недоступны
        accessible={false}
        snapPoints={['70%']}
        enableDynamicSizing={false}
        backdropComponent={(p) => (
          <BottomSheetBackdrop {...p} appearsOnIndex={0} disappearsOnIndex={-1} />
        )}
        backgroundStyle={{ backgroundColor: palette.surface, borderRadius: 20 }}
        handleIndicatorStyle={{ backgroundColor: palette.dim, width: 36 }}
      >
        <View className="flex-row items-center justify-between px-[19px] pb-3 pt-2">
          <Text
            accessibilityRole="header"
            className="flex-1 font-semibold text-[17px] tracking-[-0.3px] text-text"
          >
            {placeholder}
          </Text>
          <Tooltip content={t('taskCard.close')}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('taskCard.close')}
              onPress={() => sheet.current?.dismiss()}
              hitSlop={8}
              className="size-7 items-center justify-center rounded-[7px]"
            >
              <XIcon size={16} color={palette.faint} />
            </Pressable>
          </Tooltip>
        </View>
        <BottomSheetScrollView
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 14) }}
        >
          {options.length === 0 ? (
            <Text className="px-[19px] py-6 text-center font-regular text-[13px] text-dim">
              {empty}
            </Text>
          ) : (
            options.map((o) => (
              <Pressable
                key={o.value}
                accessibilityRole="button"
                onPress={() => {
                  onPick(o.value);
                  sheet.current?.dismiss();
                }}
                className="mx-[11px] min-h-[44px] justify-center rounded-9 px-3 py-2 active:bg-row-highlight"
              >
                <Text className="font-regular text-[13px] leading-[18px] tracking-[-0.1px] text-text">
                  {o.label}
                </Text>
                {o.hint && (
                  <Text className="mt-[2px] font-regular text-[11px] text-dim">{o.hint}</Text>
                )}
              </Pressable>
            ))
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
    </>
  );
}
