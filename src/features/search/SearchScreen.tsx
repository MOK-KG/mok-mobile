import { FlashList } from '@shopify/flash-list';
import { type Href, router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/app/providers/ThemeProvider';
import { themes } from '@/shared/config/tokens';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import { useSearch } from './api';
import { highlight, type SearchKind, type SearchTarget, searchKinds, searchStems } from './search';

const hrefOf = (target: SearchTarget): Href => {
  switch (target.kind) {
    case 'task':
      return `/tasks/${target.id}`;
    case 'document':
      return `/documents/${target.id}`;
    case 'article':
      return `/knowledge/${target.id}`;
    case 'chat':
      return `/chat/${target.chatId}`;
  }
};

function Marked({ text, stems, className }: { text: string; stems: string[]; className: string }) {
  return (
    <Text numberOfLines={2} className={className}>
      {highlight(text, stems).map((part, i) => (
        <Text
          // biome-ignore lint/suspicious/noArrayIndexKey: части одной строки, порядок постоянный
          key={i}
          className={part.hit ? 'bg-warning-chip font-medium text-text' : undefined}
        >
          {part.text}
        </Text>
      ))}
    </Text>
  );
}

/** Поиск по системе (S-09): только то, к чему есть доступ (приёмка 11.3) — общий с вебом */
export function SearchScreen() {
  const { t } = useTranslation();
  const palette = themes[useTheme().theme];
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<SearchKind | null>(null);
  const { results, allowed } = useSearch(query);
  const kinds = searchKinds.filter((k) => allowed[k]);
  const stems = searchStems(query);
  const total = kinds.reduce((n, k) => n + results[k].length, 0);
  const shown = (kind ? [kind] : kinds).flatMap((k) => results[k]);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScreenHeader title={t('search.title')} fallback="/" />
      <View className="px-4 pt-1">
        <TextInput
          autoFocus
          value={query}
          onChangeText={setQuery}
          placeholder={t('search.placeholder')}
          placeholderTextColor={palette.dim}
          accessibilityLabel={t('search.label')}
          returnKeyType="search"
          className="h-11 rounded-9 border border-line bg-panel px-3 font-regular text-[14px] text-text"
        />
      </View>
      {stems.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="max-h-12 grow-0"
          contentContainerClassName="items-center gap-[7px] px-4 py-[10px]"
        >
          {[null, ...kinds].map((k) => {
            const active = k === kind;
            return (
              <Pressable
                key={k ?? 'all'}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                onPress={() => setKind(k)}
                className={`h-7 flex-row items-center gap-[6px] rounded-8 border px-[9px] ${
                  active ? 'border-transparent bg-control-active' : 'border-line bg-panel'
                }`}
              >
                <Text
                  className={`text-[12px] ${active ? 'font-semibold text-text' : 'font-regular text-sub'}`}
                >
                  {k ? t(`search.kind.${k}`) : t('search.all')}
                </Text>
                <Text
                  className={`font-medium text-[10.5px] ${active ? 'text-tone-gold' : 'text-dim'}`}
                >
                  {k ? results[k].length : total}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
      <FlashList
        data={stems.length ? shown : []}
        keyExtractor={(h) => h.id}
        renderItem={({ item: h }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${t(`search.kind.${h.kind}`)}: ${h.title}`}
            onPress={() => router.push(hrefOf(h.target))}
            className="gap-[3px] bg-panel px-4 py-3 active:bg-row-highlight"
          >
            <Text className="font-medium text-[10.5px] uppercase tracking-[0.8px] text-dim">
              {t(`search.kind.${h.kind}`)}
            </Text>
            <Marked text={h.title} stems={stems} className="font-regular text-[14px] text-text" />
            {!!h.subtitle && (
              <Marked
                text={h.subtitle}
                stems={stems}
                className="font-regular text-[12px] text-faint"
              />
            )}
            {h.snippet && (
              <Marked
                text={h.snippet}
                stems={stems}
                className="font-regular text-[12.5px] text-sub"
              />
            )}
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View className="h-px bg-line" />}
        ListEmptyComponent={
          <Text className="px-6 py-10 text-center font-regular text-[13px] text-dim">
            {stems.length ? t('search.nothing', { query }) : t('search.prompt')}
          </Text>
        }
        ListFooterComponent={
          stems.length ? (
            <Text className="px-4 py-4 font-regular text-[11.5px] leading-4 text-dim">
              {t('search.note')}
            </Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
