import { FlashList } from '@shopify/flash-list';
import { type Href, router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/app/providers/ThemeProvider';
import { themes } from '@/shared/config/tokens';
import { formatInBishkek } from '@/shared/lib/date';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import { useFiles } from './api';
import {
  type FileSource,
  type FileTarget,
  type FileType,
  fileSources,
  filterFiles,
  formatSize,
} from './collect';

const typeBadge: Record<FileType, string> = {
  pdf: 'bg-tone-red-bg text-tone-red',
  doc: 'bg-tone-blue-bg text-tone-blue',
  sheet: 'bg-tone-green-bg text-tone-green',
  image: 'bg-tone-purple-bg text-tone-purple',
  other: 'bg-chip text-chip-text',
};

const targetHref = (target: FileTarget): Href =>
  target.kind === 'document'
    ? `/documents/${target.id}`
    : target.kind === 'article'
      ? `/knowledge/${target.id}`
      : `/chat/${target.chatId}`;

/**
 * Файлы (из вкладки «Ещё»): вложения Документов, Базы знаний и переписок, к которым есть
 * доступ. Нажатие открывает место, где лежит файл. Логика — общая с вебом (collect.ts).
 */
export function FilesScreen() {
  const { t, i18n } = useTranslation();
  const palette = themes[useTheme().theme];
  const { items, pending, allowed } = useFiles();
  const [source, setSource] = useState<FileSource | null>(null);
  const [query, setQuery] = useState('');
  const sources = fileSources.filter((s) => allowed[s]);
  const shown = filterFiles(items, { source, type: null, query });
  const units = { kb: t('files.kb'), mb: t('files.mb') };

  const chip = (active: boolean) =>
    `h-7 flex-row items-center gap-[6px] rounded-8 border px-[9px] ${
      active ? 'border-transparent bg-control-active' : 'border-line bg-panel'
    }`;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScreenHeader title={t('sections.files')} fallback="/more" />
      <View className="px-4 pt-1">
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('files.search')}
          placeholderTextColor={palette.dim}
          accessibilityLabel={t('files.search')}
          className="h-10 rounded-9 border border-line bg-panel px-3 font-regular text-[13.5px] text-text"
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="max-h-12 grow-0"
        contentContainerClassName="items-center gap-[7px] px-4 py-[10px]"
      >
        {[null, ...sources].map((s) => {
          const active = s === source;
          return (
            <Pressable
              key={s ?? 'all'}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              onPress={() => setSource(s)}
              className={chip(active)}
            >
              <Text
                className={`text-[12px] ${active ? 'font-semibold text-text' : 'font-regular text-sub'}`}
              >
                {s ? t(`files.source.${s}`) : t('files.all')}
              </Text>
              <Text
                className={`font-medium text-[10.5px] ${active ? 'text-tone-gold' : 'text-dim'}`}
              >
                {filterFiles(items, { source: s, type: null, query }).length}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <FlashList
        data={shown}
        keyExtractor={(f) => f.id}
        renderItem={({ item: f }) => {
          const size = formatSize(f.size, units);
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${f.name}.${f.ext} · ${f.place}`}
              onPress={() => router.push(targetHref(f.target))}
              className="flex-row items-center gap-3 bg-panel px-4 py-3 active:bg-row-highlight"
            >
              <View
                className={`h-7 w-11 items-center justify-center rounded-6 ${typeBadge[f.type]}`}
              >
                <Text
                  className={`font-semibold text-[10px] uppercase ${typeBadge[f.type].split(' ')[1]}`}
                >
                  {f.ext || '—'}
                </Text>
              </View>
              <View className="min-w-0 flex-1 gap-[2px]">
                <Text numberOfLines={1} className="font-regular text-[14px] text-text">
                  {f.name}
                </Text>
                <Text numberOfLines={1} className="font-regular text-[12px] text-sub">
                  {f.place}
                </Text>
                <Text numberOfLines={1} className="font-regular text-[11px] text-dim">
                  {[
                    t(`files.source.${f.source}`),
                    f.addedBy,
                    formatInBishkek(f.at, 'd MMM', i18n.language).replace('.', ''),
                    size,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </View>
            </Pressable>
          );
        }}
        ItemSeparatorComponent={() => <View className="h-px bg-line" />}
        ListEmptyComponent={
          pending ? null : (
            <Text className="py-10 text-center font-regular text-[13px] text-dim">
              {query || source ? t('files.nothingFound') : t('files.empty')}
            </Text>
          )
        }
        ListFooterComponent={
          <Text className="px-4 py-4 font-regular text-[11.5px] leading-4 text-dim">
            {t('files.note')}
          </Text>
        }
      />
    </SafeAreaView>
  );
}
