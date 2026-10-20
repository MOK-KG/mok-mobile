import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { type RefObject, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/app/providers/ThemeProvider';
import { themes } from '@/shared/config/tokens';
import { toast } from '@/shared/lib/toast';
import { CheckboxCheckIcon, XIcon } from '@/shared/ui/icons';
import { Tooltip } from '@/shared/ui/Tooltip';
import {
  type DueFilter,
  dueFilters,
  emptyFilters,
  hasFilters,
  matchesDue,
  type TaskFilters,
} from '../filters';
import type { Project, Task } from '../types';
import { toneClasses } from '../ui';

const dueLabel: Record<DueFilter, string> = {
  overdue: 'tasks.dueOverdue',
  week: 'tasks.dueWeek',
  none: 'tasks.dueNone',
};

type Props = {
  sheetRef: RefObject<BottomSheetModal | null>;
  tasks: Task[];
  value: TaskFilters;
  onApply: (f: TaskFilters) => void;
  /** Сколько задач покажет список с этими фильтрами (с учётом быстрого фильтра и поиска) */
  countWith: (f: TaskFilters) => number;
};

/**
 * Шторка фильтра (макет Figma: «Мобильный фильтр»). Кнопка показывает число задач.
 * Если применили пустой фильтр вместо прежнего — тост с «Вернуть»: набор собирали руками
 */
export function FilterSheet({ sheetRef, tasks, value, onApply, countWith }: Props) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const palette = themes[theme];
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<TaskFilters>(value);
  useEffect(() => setDraft(value), [value]);

  const projects = [
    ...new Map(
      tasks.filter((x) => x.project).map((x) => [x.project?.id, x.project as Project]),
    ).values(),
  ];

  const toggle = <K extends keyof TaskFilters>(key: K, item: string) =>
    setDraft((d) => {
      const list = d[key] as string[];
      return {
        ...d,
        [key]: list.includes(item) ? list.filter((x) => x !== item) : [...list, item],
      };
    });

  const row = (
    checked: boolean,
    label: string,
    count: number,
    onPress: () => void,
    dot?: string,
  ) => (
    <Pressable
      key={label}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onPress}
      className={`mx-[11px] h-[42px] flex-row items-center gap-[10px] rounded-9 px-3 ${checked ? 'bg-control-active' : ''}`}
    >
      <View
        className={`size-[18px] items-center justify-center rounded-[5px] ${checked ? 'bg-info' : 'border-[1.4px] border-dim'}`}
      >
        {checked && <CheckboxCheckIcon size={12} color={palette.panel} />}
      </View>
      {dot && <View className={`size-[7px] rounded-full ${dot}`} />}
      <Text
        className={`flex-1 text-[13px] tracking-[-0.1px] ${checked ? 'font-medium text-text' : 'font-regular text-sub'}`}
      >
        {label}
      </Text>
      <Text className="font-regular text-[11px] text-dim">{count}</Text>
    </Pressable>
  );

  const section = 'mx-[19px] mb-2 font-semibold text-[10px] uppercase tracking-[1.4px] text-dim';

  return (
    <BottomSheetModal
      ref={sheetRef}
      // По умолчанию шторка — один элемент для диктора, и флажки внутри недоступны
      accessible={false}
      snapPoints={['88%']}
      enableDynamicSizing={false}
      backdropComponent={(p) => (
        <BottomSheetBackdrop {...p} appearsOnIndex={0} disappearsOnIndex={-1} />
      )}
      backgroundStyle={{ backgroundColor: palette.surface, borderRadius: 20 }}
      handleIndicatorStyle={{ backgroundColor: palette.dim, width: 36 }}
      onDismiss={() => setDraft(value)}
    >
      <View className="flex-row items-center justify-between px-[19px] pb-3 pt-2">
        <Text className="font-semibold text-[17px] tracking-[-0.3px] text-text">
          {t('tasks.filter')}
        </Text>
        <Tooltip content={t('taskCard.close')}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('taskCard.close')}
            onPress={() => sheetRef.current?.dismiss()}
            hitSlop={8}
            className="size-7 items-center justify-center rounded-[7px]"
          >
            <XIcon size={16} color={palette.faint} />
          </Pressable>
        </Tooltip>
      </View>
      <BottomSheetScrollView>
        <Text className={section}>{t('tasks.filterProject')}</Text>
        {projects.map((p) =>
          row(
            draft.projects.includes(p.id),
            p.name,
            tasks.filter((x) => x.project?.id === p.id).length,
            () => toggle('projects', p.id),
            toneClasses[p.tone].dot,
          ),
        )}
        <View className="my-3 h-px bg-line" />
        <Text className={section}>{t('tasks.filterDue')}</Text>
        {dueFilters.map((d) =>
          row(
            draft.due.includes(d),
            t(dueLabel[d]),
            tasks.filter((x) => matchesDue(x, d)).length,
            () => toggle('due', d),
          ),
        )}
      </BottomSheetScrollView>
      <View
        className="flex-row gap-3 border-t border-line px-[19px] pt-[14px]"
        style={{ paddingBottom: Math.max(insets.bottom, 14) }}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => setDraft(emptyFilters)}
          className="h-11 items-center justify-center rounded-[10px] border border-line px-4"
        >
          <Text className="font-medium text-[13px] text-sub">{t('tasks.reset')}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            const previous = value;
            onApply(draft);
            sheetRef.current?.dismiss();
            if (hasFilters(previous) && !hasFilters(draft)) {
              toast.info({
                title: t('tasks.filtersCleared'),
                action: { label: t('tasks.undo'), onPress: () => onApply(previous) },
              });
            }
          }}
          className="h-11 flex-1 items-center justify-center rounded-[10px] bg-brand-red active:opacity-80"
        >
          <Text className="font-semibold text-[13.5px] tracking-[-0.1px] text-[#FFFFFF]">
            {t('tasks.showTasks', { count: countWith(draft) })}
          </Text>
        </Pressable>
      </View>
    </BottomSheetModal>
  );
}
