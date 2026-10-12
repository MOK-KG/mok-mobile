import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/app/providers/ThemeProvider';
import { Can } from '@/features/auth';
import { themes } from '@/shared/config/tokens';
import { FilterIcon, MenuIcon, PlusIcon, SearchIcon, XIcon } from '@/shared/ui/icons';
import { useTasks } from './api';
import { applyFilters, emptyFilters, hasFilters, type TaskFilters } from './filters';
import { matchesQuick, type QuickFilter, quickFilters, sortForList } from './list';
import { FilterSheet } from './list/FilterSheet';
import { TaskListItem } from './list/TaskListItem';

/** Раздел «Задачи» на мобильном: список вместо доски (макет Figma: «Мобильный список») */
export function TasksScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const palette = themes[theme];
  const tasks = useTasks('department');
  const [quick, setQuick] = useState<QuickFilter>('all');
  const [filters, setFilters] = useState<TaskFilters>(emptyFilters);
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const sheet = useRef<BottomSheetModal>(null);

  const all = tasks.data ?? [];
  const visibleWith = (f: TaskFilters) =>
    applyFilters(all, f, search).filter((task) => matchesQuick(task, quick));
  const visible = useMemo(
    () =>
      sortForList(applyFilters(all, filters, search).filter((task) => matchesQuick(task, quick))),
    [all, filters, search, quick],
  );

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <View className="h-[52px] flex-row items-center gap-2 border-b border-line bg-panel px-4">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('tasks.openMenu')}
          onPress={() => router.navigate('/')}
          hitSlop={8}
          className="size-7 items-center justify-center rounded-[7px]"
        >
          <MenuIcon size={16} color={palette.sub} />
        </Pressable>
        {searching ? (
          <TextInput
            autoFocus
            value={search}
            onChangeText={setSearch}
            placeholder={t('tasks.search')}
            placeholderTextColor={palette.dim}
            accessibilityLabel={t('tasks.search')}
            className="h-9 flex-1 rounded-8 bg-surface px-3 font-regular text-[14px] text-text"
          />
        ) : (
          <Text
            accessibilityRole="header"
            className="ml-1 flex-1 font-semibold text-[17px] tracking-[-0.3px] text-text"
          >
            {t('sections.tasks')}
          </Text>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={searching ? t('tasks.closeSearch') : t('tasks.search')}
          onPress={() => {
            if (searching) setSearch('');
            setSearching((s) => !s);
          }}
          hitSlop={8}
          className="size-7 items-center justify-center rounded-[7px]"
        >
          {searching ? (
            <XIcon size={16} color={palette.sub} />
          ) : (
            <SearchIcon size={16} color={palette.sub} />
          )}
        </Pressable>
        <Can permission="tasks.create">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('tasks.newTask')}
            onPress={() => Alert.alert(t('tasks.newTask'), t('tasks.comingSoon'))}
            className="size-7 items-center justify-center rounded-8 bg-brand-red active:opacity-80"
          >
            <PlusIcon size={16} color="#FFFFFF" />
          </Pressable>
        </Can>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="max-h-12 grow-0"
        contentContainerClassName="items-center gap-[7px] px-4 py-[10px]"
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('tasks.filter')}
          onPress={() => sheet.current?.present()}
          className={`h-7 w-[34px] items-center justify-center rounded-8 border ${
            hasFilters(filters) ? 'border-info bg-control-active' : 'border-line bg-panel'
          }`}
        >
          <FilterIcon size={16} color={hasFilters(filters) ? palette.text : palette.sub} />
        </Pressable>
        {quickFilters.map((q) => {
          const active = q === quick;
          const count = applyFilters(all, filters, search).filter((task) =>
            matchesQuick(task, q),
          ).length;
          return (
            <Pressable
              key={q}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              onPress={() => setQuick(q)}
              className={`h-7 flex-row items-center gap-[6px] rounded-8 border px-[9px] ${
                active ? 'border-transparent bg-control-active' : 'border-line bg-panel'
              }`}
            >
              <Text
                className={`text-[12px] tracking-[-0.1px] ${active ? 'font-semibold text-text' : 'font-regular text-sub'}`}
              >
                {t(`tasks.quick.${q}`)}
              </Text>
              <Text
                className={`font-medium text-[10.5px] ${active ? 'text-tone-gold' : 'text-dim'}`}
              >
                {count}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <FlashList
        data={visible}
        keyExtractor={(task) => task.id}
        renderItem={({ item }) => <TaskListItem task={item} />}
        ItemSeparatorComponent={() => <View className="mx-4 h-px bg-line" />}
        ListEmptyComponent={
          tasks.isPending ? null : (
            <Text className="py-10 text-center font-regular text-[13px] text-dim">
              {t('tasks.noResults')}
            </Text>
          )
        }
      />

      <FilterSheet
        sheetRef={sheet}
        tasks={all}
        value={filters}
        onApply={setFilters}
        countWith={(f) => visibleWith(f).length}
      />
    </SafeAreaView>
  );
}
