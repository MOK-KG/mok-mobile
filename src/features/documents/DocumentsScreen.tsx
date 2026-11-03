import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/app/providers/ThemeProvider';
import { RequirePermission } from '@/features/auth';
import { themes } from '@/shared/config/tokens';
import { formatIsoDate } from '@/shared/lib/date';
import { TabHeader } from '@/shared/ui/TabHeader';
import { docNumber, useDocuments } from './api';
import { StatusChip } from './parts';
import { type DocKind, type DocStatus, docKinds, statusesOf } from './types';

/**
 * Делопроизводство (вкладка «Документы»): входящие, исходящие, приказы; поиск и статусы.
 * Регистрация и проекты — на вебе; здесь — просмотр, резолюция, отправка и аннулирование.
 */
export function DocumentsScreen() {
  return (
    <RequirePermission permission="documents.view">
      <List />
    </RequirePermission>
  );
}

function List() {
  const { t, i18n } = useTranslation();
  const palette = themes[useTheme().theme];
  const [kind, setKind] = useState<DocKind>('incoming');
  const [status, setStatus] = useState<DocStatus | null>(null);
  const [query, setQuery] = useState('');
  const documents = useDocuments();
  const all = documents.data ?? [];
  const ofKind = useMemo(() => all.filter((d) => d.kind === kind), [all, kind]);
  const needle = query.trim().toLocaleLowerCase('ru');
  const shown = useMemo(
    () =>
      ofKind.filter(
        (d) =>
          (!status || d.status === status) &&
          (!needle ||
            [docNumber(d), d.title, d.party, d.senderRef].some((v) =>
              v?.toLocaleLowerCase('ru').includes(needle),
            )),
      ),
    [ofKind, status, needle],
  );

  const chip = (active: boolean) =>
    `h-7 flex-row items-center gap-[6px] rounded-8 border px-[9px] ${
      active ? 'border-transparent bg-control-active' : 'border-line bg-panel'
    }`;
  const chipText = (active: boolean) =>
    `text-[12px] tracking-[-0.1px] ${active ? 'font-semibold text-text' : 'font-regular text-sub'}`;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <TabHeader title={t('sections.documents')} />
      <View className="flex-row border-b border-line bg-panel px-2">
        {docKinds.map((k) => {
          const active = k === kind;
          return (
            <Pressable
              key={k}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => {
                setKind(k);
                setStatus(null);
              }}
              className="flex-1 items-center py-[10px]"
            >
              <Text className={chipText(active)}>
                {t(`documents.tab.${k}`)}{' '}
                <Text
                  className={`font-medium text-[11px] ${active ? 'text-tone-gold' : 'text-dim'}`}
                >
                  {all.filter((d) => d.kind === k).length}
                </Text>
              </Text>
              {active && (
                <View className="absolute bottom-0 h-[2px] w-12 rounded-[1px] bg-brand-red" />
              )}
            </Pressable>
          );
        })}
      </View>
      <View className="px-4 pt-3">
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('documents.search')}
          placeholderTextColor={palette.dim}
          accessibilityLabel={t('documents.search')}
          className="h-10 rounded-9 border border-line bg-panel px-3 font-regular text-[13.5px] text-text"
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="max-h-12 grow-0"
        contentContainerClassName="items-center gap-[7px] px-4 py-[10px]"
      >
        {[null, ...statusesOf[kind]].map((s) => {
          const active = s === status;
          return (
            <Pressable
              key={s ?? 'all'}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              onPress={() => setStatus(s)}
              className={chip(active)}
            >
              <Text className={chipText(active)}>
                {s ? t(`documents.status.${s}`) : t('documents.all')}
              </Text>
              <Text
                className={`font-medium text-[10.5px] ${active ? 'text-tone-gold' : 'text-dim'}`}
              >
                {s ? ofKind.filter((d) => d.status === s).length : ofKind.length}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <FlashList
        data={shown}
        keyExtractor={(d) => d.id}
        renderItem={({ item: d }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${docNumber(d) ?? t('documents.noNumber')} · ${d.title}`}
            onPress={() => router.push(`/documents/${d.id}`)}
            className="gap-[5px] bg-panel px-4 py-3 active:bg-row-highlight"
          >
            <View className="flex-row items-center justify-between gap-2">
              <Text
                className={`font-medium text-[12px] ${
                  d.status === 'annulled' ? 'text-dim line-through' : 'text-faint'
                }`}
              >
                {docNumber(d) ?? t('documents.noNumber')}
                {' · '}
                {formatIsoDate(d.date, 'd MMM', i18n.language).replace('.', '')}
              </Text>
              <StatusChip status={d.status} />
            </View>
            <Text numberOfLines={2} className="font-regular text-[14px] leading-[19px] text-text">
              {d.title}
            </Text>
            {d.party && (
              <Text numberOfLines={1} className="font-regular text-[12px] text-sub">
                {d.party}
              </Text>
            )}
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View className="h-px bg-line" />}
        ListEmptyComponent={
          documents.isPending ? null : (
            <Text className="py-10 text-center font-regular text-[13px] text-dim">
              {needle || status ? t('documents.nothingFound') : t('documents.empty')}
            </Text>
          )
        }
      />
    </SafeAreaView>
  );
}
