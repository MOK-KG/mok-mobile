import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useDeferredValue, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/app/providers/ThemeProvider';
import { Can } from '@/features/auth';
import { themes } from '@/shared/config/tokens';
import {
  ClearIcon,
  DocMiniIcon,
  LockIcon,
  PlusIcon,
  SearchIcon,
  ShieldCheckIcon,
  TasksMiniIcon,
} from '@/shared/ui/icons';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import { Tooltip } from '@/shared/ui/Tooltip';
import { useKnowledge, useKnowledgeSearch } from './api';
import { Avatar, FreshnessBadge, useShortDate } from './parts';
import { checkedAt, freshnessOf, queryStems } from './search';
import type { KbArticleSummary, KbHiddenMatches } from './types';

/**
 * База знаний на мобильном (макета нет — по web-макету «Список статей»): поиск, разделы
 * чипами, статьи списком. Закрытый раздел виден, но не открывается; поиск и счётчики — с учётом прав.
 */
export function KnowledgeScreen() {
  const { t } = useTranslation();
  const palette = themes[useTheme().theme];
  const list = useKnowledge();
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const searching = queryStems(query).length > 0;
  const search = useKnowledgeSearch(useDeferredValue(query));

  const sections = list.data?.sections ?? [];
  const articles = list.data?.articles ?? [];
  const current = sections.find((s) => s.id === sectionId && s.accessible) ?? null;
  const closed = sections.filter((s) => !s.accessible);

  const foundIds = new Set(searching ? (search.data?.ids ?? []) : []);
  const inSection = articles.filter((a) => !current || a.sectionId === current.id);
  const shown = [
    ...inSection.filter((a) => foundIds.has(a.id)),
    ...inSection.filter((a) => !foundIds.has(a.id)),
  ];
  const foundTotal = articles.filter((a) => foundIds.has(a.id)).length;
  const foundHere = shown.filter((a) => foundIds.has(a.id)).length;
  const showFound = searching && !!search.data;

  const chip = (selected: boolean) =>
    `h-8 flex-row items-center gap-[6px] rounded-8 border px-[10px] ${
      selected ? 'border-transparent bg-nav-active' : 'border-line bg-panel'
    }`;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScreenHeader
        title={t('sections.knowledge')}
        fallback="/more"
        right={
          <Can permission="knowledge.edit">
            <Tooltip content={t('knowledge.newArticle')}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('knowledge.newArticle')}
                onPress={() =>
                  router.push(current ? `/knowledge/new?section=${current.id}` : '/knowledge/new')
                }
                className="mr-1 size-7 items-center justify-center rounded-8 bg-brand-red active:opacity-80"
              >
                <PlusIcon size={16} color="#FFFFFF" />
              </Pressable>
            </Tooltip>
          </Can>
        }
      />

      <View className="px-4 pt-3">
        <View
          className={`h-10 flex-row items-center gap-2 rounded-9 border bg-panel pl-3 pr-2 ${
            query ? 'border-info' : 'border-line'
          }`}
        >
          <SearchIcon size={16} color={query ? palette.info : palette.faint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('knowledge.search')}
            placeholderTextColor={palette.dim}
            accessibilityLabel={t('knowledge.search')}
            returnKeyType="search"
            className="h-10 flex-1 font-regular text-[14px] text-text"
          />
          {query !== '' && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('knowledge.clearSearch')}
              onPress={() => setQuery('')}
              hitSlop={8}
              className="size-6 items-center justify-center rounded-6"
            >
              <ClearIcon size={12} color={palette.faint} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="max-h-[52px] grow-0"
        contentContainerClassName="items-center gap-[7px] px-4 py-[10px]"
      >
        <Pressable
          accessibilityRole="radio"
          accessibilityState={{ checked: current === null }}
          onPress={() => setSectionId(null)}
          className={chip(current === null)}
        >
          <Text
            className={`text-[12px] tracking-[-0.1px] ${current === null ? 'font-semibold text-text' : 'font-regular text-sub'}`}
          >
            {t('knowledge.allArticles')}
          </Text>
          <Text className="font-regular text-[10.5px] text-dim">{articles.length}</Text>
        </Pressable>
        {sections.map((s) => {
          const selected = current?.id === s.id;
          if (!s.accessible) {
            return (
              <Tooltip key={s.id} content={t('knowledge.closedSection')}>
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ disabled: true }}
                  accessibilityLabel={`${s.name}. ${t('knowledge.closedSection')}`}
                  className={`${chip(false)} opacity-60`}
                >
                  <LockIcon size={14} color={palette.dim} />
                  <Text className="font-regular text-[12px] text-dim">{s.name}</Text>
                  <Text className="font-regular text-[10.5px] text-dim">{s.count}</Text>
                </Pressable>
              </Tooltip>
            );
          }
          return (
            <Pressable
              key={s.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => setSectionId(s.id)}
              className={chip(selected)}
            >
              <Text
                className={`text-[12px] tracking-[-0.1px] ${selected ? 'font-semibold text-text' : 'font-regular text-sub'}`}
              >
                {s.name}
              </Text>
              <Text className="font-regular text-[10.5px] text-dim">{s.count}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {showFound && (
        <View
          accessibilityLiveRegion="polite"
          className="mx-4 mb-[10px] flex-row gap-2 rounded-9 border border-info-line bg-notice-info px-3 py-2"
        >
          <ShieldCheckIcon size={16} color={palette.info} />
          <View className="flex-1">
            <Text className="font-medium text-[12.5px] tracking-[-0.1px] text-notice-info-title">
              {foundTotal > 0
                ? t('knowledge.found', { count: foundTotal, query: query.trim() })
                : t('knowledge.nothingFound', { query: query.trim() })}
            </Text>
            <Text className="mt-[2px] font-regular text-[11px] leading-[15px] text-notice-info-text">
              {t('knowledge.foundNote')}
            </Text>
          </View>
        </View>
      )}

      <FlashList
        data={shown}
        keyExtractor={(a) => a.id}
        ListHeaderComponent={
          <View className="flex-row items-baseline gap-2 border-y border-line bg-panel px-4 py-3">
            <Text
              accessibilityRole="header"
              className="font-semibold text-[15px] tracking-[-0.2px] text-text"
            >
              {current?.name ?? t('knowledge.allArticles')}
            </Text>
            <Text className="font-regular text-[11.5px] text-faint">
              {[
                t('knowledge.articles', { count: current ? current.count : articles.length }),
                showFound && t('knowledge.foundInSection', { count: foundHere }),
              ]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <ArticleItem
            article={item}
            found={foundIds.has(item.id)}
            onPress={() => router.push(`/knowledge/${item.id}`)}
          />
        )}
        ItemSeparatorComponent={() => (
          <View className="bg-panel">
            <View className="mx-4 h-px bg-line" />
          </View>
        )}
        ListEmptyComponent={
          list.isPending ? null : (
            <Text className="py-10 text-center font-regular text-[13px] text-dim">
              {list.isError ? t('knowledge.loadError') : t('knowledge.empty')}
            </Text>
          )
        }
        ListFooterComponent={
          <View className="gap-3 px-4 py-4">
            {showFound &&
              search.data?.hidden.map((h) => <HiddenMatches key={h.sectionId} hidden={h} />)}
            {closed.length > 0 && (
              <Text className="font-regular text-[11px] leading-[15px] text-dim">
                {t('knowledge.closedNote', {
                  count: closed.length,
                  names: closed.map((s) => (closed.length > 1 ? `«${s.name}»` : s.name)).join(', '),
                })}
              </Text>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}

function ArticleItem({
  article: a,
  found,
  onPress,
}: {
  article: KbArticleSummary;
  found: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const palette = themes[useTheme().theme];
  const shortDate = useShortDate();
  const freshness = freshnessOf(checkedAt(a));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a.title}
      onPress={onPress}
      className={`relative px-4 pb-3 pt-[14px] ${found ? 'bg-row-match' : 'bg-panel active:bg-row-highlight'}`}
    >
      {found && <View className="absolute bottom-0 left-0 top-0 w-[3px] bg-info" />}
      {freshness && (
        <View className="mb-[6px]">
          <FreshnessBadge freshness={freshness} />
        </View>
      )}
      <Text className="font-medium text-[14px] leading-[19px] tracking-[-0.15px] text-text">
        {a.title}
      </Text>
      <Text numberOfLines={2} className="mt-1 font-regular text-[12.5px] leading-[18px] text-faint">
        {a.summary}
      </Text>
      <View className="mt-[10px] flex-row items-center">
        <Avatar person={a.author} size={20} />
        <Text className="ml-[6px] font-regular text-[11px] text-sub">{a.author.short}</Text>
        <Text className="mx-[6px] font-regular text-[11px] text-dim">·</Text>
        <Text numberOfLines={1} className="flex-1 font-regular text-[11px] text-dim">
          {t('knowledge.updated', { date: shortDate(a.updatedAt) })}
        </Text>
        {a.tasksCount > 0 && (
          <View
            accessibilityLabel={t('knowledge.tasksCount', { count: a.tasksCount })}
            className="ml-[10px] flex-row items-center gap-[3px]"
          >
            <TasksMiniIcon size={13} color={palette.dim} />
            <Text className="font-regular text-[11px] text-faint">{a.tasksCount}</Text>
          </View>
        )}
        {a.documentsCount > 0 && (
          <View
            accessibilityLabel={t('knowledge.documentsCount', { count: a.documentsCount })}
            className="ml-[10px] flex-row items-center gap-[3px]"
          >
            <DocMiniIcon size={13} color={palette.dim} />
            <Text className="font-regular text-[11px] text-faint">{a.documentsCount}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function HiddenMatches({ hidden }: { hidden: KbHiddenMatches }) {
  const { t } = useTranslation();
  const palette = themes[useTheme().theme];
  return (
    <View className="flex-row gap-2 rounded-9 border border-line bg-muted-soft px-3 py-[10px]">
      <ShieldCheckIcon size={16} color={palette.dim} />
      <View className="flex-1">
        <Text className="font-medium text-[12px] tracking-[-0.1px] text-faint">
          {t('knowledge.hidden', { count: hidden.count, section: hidden.sectionName })}
        </Text>
        <Text className="mt-[2px] font-regular text-[11px] leading-[15px] text-dim">
          {t('knowledge.hiddenNote')}
        </Text>
      </View>
    </View>
  );
}
