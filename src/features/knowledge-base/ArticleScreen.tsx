import { router } from 'expo-router';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/app/providers/ThemeProvider';
import { ForbiddenScreen, useCan } from '@/features/auth';
import type { TaskStatus } from '@/features/tasks/types';
import { ApiError } from '@/shared/api/errors';
import { themes } from '@/shared/config/tokens';
import { formatIsoDate } from '@/shared/lib/date';
import { AttachLargeIcon, ClockIcon, DocSmallIcon, TasksSmallIcon } from '@/shared/ui/icons';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import { useArticle, useKnowledge } from './api';
import { Avatar, capsTitle, FreshnessBadge, useShortDate } from './parts';
import { freshnessOf } from './search';
import type { KbArticle, KbBlock } from './types';

const ATTACHMENTS_ID = 'attachments';

const statusChip: Record<TaskStatus, string> = {
  queue: 'bg-chip text-chip-text',
  in_progress: 'bg-info-chip text-info',
  review: 'bg-warning-chip text-warning-strong',
  done: 'bg-success-chip text-success',
};

/** Статья базы знаний на мобильном: текст, затем содержание, связи и история версий */
export function ArticleScreen({ articleId }: { articleId: string }) {
  const { t } = useTranslation();
  const article = useArticle(articleId);
  const section = useKnowledge().data?.sections.find((s) => s.id === article.data?.sectionId);

  if (article.error instanceof ApiError && article.error.status === 403) return <ForbiddenScreen />;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScreenHeader title={section?.name ?? t('sections.knowledge')} fallback="/knowledge" />
      {article.isError ? (
        <View className="m-4 items-center rounded-14 border border-line bg-panel p-6">
          <Text className="font-semibold text-[16px] text-text">
            {article.error instanceof ApiError && article.error.status === 404
              ? t('knowledge.notFoundTitle')
              : t('knowledge.loadError')}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/knowledge')}
            className="mt-4 rounded-9 bg-surface px-4 py-2 active:opacity-80"
          >
            <Text className="font-medium text-[13px] text-text">{t('knowledge.toList')}</Text>
          </Pressable>
        </View>
      ) : (
        article.data && <ArticleBody article={article.data} />
      )}
    </SafeAreaView>
  );
}

function ArticleBody({ article: a }: { article: KbArticle }) {
  const { t, i18n } = useTranslation();
  const palette = themes[useTheme().theme];
  const { can } = useCan();
  const shortDate = useShortDate();
  const scroll = useRef<ScrollView>(null);
  // Положение заголовков — для переходов из содержания. onLayout даёт y относительно родителя,
  // поэтому складываем: карточка в прокрутке + текст в карточке + заголовок в тексте
  const offsets = useRef<Record<string, number>>({});
  const cardTop = useRef(0);
  const bodyTop = useRef(0);
  const toc = [
    ...a.body.flatMap((b) => (b.kind === 'heading' ? [{ id: b.id, text: b.text }] : [])),
    ...(a.attachments.length > 0 ? [{ id: ATTACHMENTS_ID, text: t('knowledge.attachments') }] : []),
  ];
  const anchor = (id: string) => ({
    onLayout: (e: { nativeEvent: { layout: { y: number } } }) => {
      offsets.current[id] = e.nativeEvent.layout.y;
    },
  });
  const card = 'flex-row gap-2 rounded-8 border border-line bg-surface px-3 py-[10px]';
  const section = 'mt-4 rounded-14 border border-line bg-panel p-4';

  return (
    <ScrollView ref={scroll} contentContainerClassName="p-4 pb-10">
      <View
        onLayout={(e) => {
          cardTop.current = e.nativeEvent.layout.y;
        }}
        className="rounded-14 border border-line bg-panel p-4"
      >
        <FreshnessBadge freshness={freshnessOf(a.updatedAt)} large />
        <Text
          accessibilityRole="header"
          className="mt-[10px] font-semibold text-[22px] leading-[28px] tracking-[-0.5px] text-text"
        >
          {a.title}
        </Text>
        <View className="mt-3 flex-row items-center">
          <Avatar person={a.author} size={24} />
          <Text className="ml-2 font-medium text-[12px] text-sub">{a.author.short}</Text>
          <Text className="mx-[6px] font-regular text-[12px] text-dim">·</Text>
          <Text numberOfLines={1} className="flex-1 font-regular text-[12px] text-dim">
            {t('knowledge.updated', {
              date: formatIsoDate(a.updatedAt, 'd MMMM yyyy', i18n.language),
            })}
          </Text>
          <Text className="overflow-hidden rounded-[5px] bg-chip px-[7px] py-[3px] font-medium text-[10px] text-chip-text">
            {t('knowledge.version', { number: a.version })}
          </Text>
        </View>
        <View className="mt-4 h-px bg-line" />

        <View
          onLayout={(e) => {
            bodyTop.current = e.nativeEvent.layout.y;
          }}
          className="mt-4"
        >
          {a.body.map((block, i) => (
            <Block
              // biome-ignore lint/suspicious/noArrayIndexKey: блоки статьи не переставляются
              key={i}
              block={block}
              first={i === 0}
              onLayout={block.kind === 'heading' ? anchor(block.id).onLayout : undefined}
            />
          ))}
          {a.attachments.length > 0 && (
            <View {...anchor(ATTACHMENTS_ID)}>
              <Text
                accessibilityRole="header"
                className="mt-[22px] font-semibold text-[15px] tracking-[-0.2px] text-text"
              >
                {t('knowledge.attachments')}
              </Text>
              <View className="mt-2 gap-2">
                {a.attachments.map((f) => (
                  <View key={f.id} className={`${card} items-center`}>
                    <AttachLargeIcon size={17} color={palette.faint} />
                    <Text numberOfLines={1} className="flex-1 font-regular text-[13px] text-sub">
                      {f.name}
                    </Text>
                    <Text className="font-regular text-[11px] tracking-[0.3px] text-dim">
                      {f.ext}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </View>

      {toc.length > 0 && (
        <View className={section}>
          <Text className={capsTitle}>{t('knowledge.toc')}</Text>
          <View className="mt-2">
            {toc.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="link"
                onPress={() =>
                  scroll.current?.scrollTo({
                    y: cardTop.current + bodyTop.current + (offsets.current[item.id] ?? 0) - 8,
                  })
                }
                className="min-h-[36px] justify-center rounded-[7px] px-2 active:bg-row-highlight"
              >
                <Text className="font-regular text-[13px] tracking-[-0.1px] text-sub">
                  {item.text}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {a.relatedTasks.length > 0 && (
        <View className={section}>
          <View className="flex-row items-center gap-2">
            <Text className={capsTitle}>{t('knowledge.relatedTasks')}</Text>
            <Text className="overflow-hidden rounded-[5px] bg-chip px-[5px] py-px font-semibold text-[9.5px] text-sub">
              {a.relatedTasks.length}
            </Text>
          </View>
          <View className="mt-[10px] gap-2">
            {a.relatedTasks.map((task, i) => {
              const linked = !!task.id && can('tasks.view');
              return (
                <Pressable
                  // biome-ignore lint/suspicious/noArrayIndexKey: у задачи без доступа нет ID
                  key={`${task.id}-${i}`}
                  accessibilityRole={linked ? 'link' : undefined}
                  disabled={!linked}
                  onPress={() => linked && router.push(`/tasks/${task.id}`)}
                  className={`${card} active:opacity-80`}
                >
                  <View className="mt-px">
                    <TasksSmallIcon size={14} color={palette.info} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-medium text-[13px] leading-[18px] tracking-[-0.1px] text-text">
                      {task.title}
                    </Text>
                    <Text
                      className={`mt-1 self-start overflow-hidden rounded-[5px] px-[7px] py-[3px] font-medium text-[10.5px] ${statusChip[task.status]}`}
                    >
                      {t(`tasks.status.${task.status}`)}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {a.relatedDocuments.length > 0 && (
        <View className={section}>
          <Text className={capsTitle}>
            {t('knowledge.relatedDocuments', { count: a.relatedDocuments.length })}
          </Text>
          <View className="mt-[10px] gap-2">
            {a.relatedDocuments.map((doc, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: номера документов в заглушке повторяются
              <View key={i} className={card}>
                <View className="mt-[2px]">
                  <DocSmallIcon size={14} color={palette.faint} />
                </View>
                <View className="flex-1">
                  <Text className="font-medium text-[13px] tracking-[-0.1px] text-text">
                    {doc.number}
                  </Text>
                  <Text className="mt-[2px] font-regular text-[11.5px] text-dim">{doc.title}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <View className={section}>
        <Text className={capsTitle}>{t('knowledge.history')}</Text>
        <View className="mt-[10px]">
          {a.versions.map((v, i) => (
            <View
              key={v.number}
              className={`py-2 ${i === 0 ? 'pt-0' : ''} ${i < a.versions.length - 1 ? 'border-b border-line' : ''}`}
            >
              <Text className="font-medium text-[12px] tracking-[-0.1px] text-sub">
                {t('knowledge.versionItem', { number: v.number, date: shortDate(v.date) })}
              </Text>
              <Text className="mt-[2px] font-regular text-[11.5px] text-dim">
                {v.author.short} — {v.change}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function Block({
  block,
  first,
  onLayout,
}: {
  block: KbBlock;
  first: boolean;
  onLayout?: (e: { nativeEvent: { layout: { y: number } } }) => void;
}) {
  const palette = themes[useTheme().theme];
  const text = 'font-regular text-[14px] leading-[22px] text-sub';
  switch (block.kind) {
    case 'paragraph':
      return <Text className={`${text} ${first ? '' : 'mt-2'}`}>{block.text}</Text>;
    case 'heading':
      return (
        <Text
          accessibilityRole="header"
          onLayout={onLayout}
          className={`font-semibold text-[16px] tracking-[-0.2px] text-text ${first ? '' : 'mt-[22px]'}`}
        >
          {block.text}
        </Text>
      );
    case 'list':
      return (
        <View className="mt-2 gap-2">
          {block.items.map((item) => (
            <View key={item} className="flex-row gap-3 pl-1">
              <View className="mt-[9px] size-[5px] rounded-full bg-faint" />
              <Text className={`${text} flex-1`}>{item}</Text>
            </View>
          ))}
        </View>
      );
    case 'note':
      return (
        <View className="relative mt-4 flex-row gap-2 overflow-hidden rounded-9 border border-warning-line bg-warning-soft py-3 pl-[15px] pr-4">
          <View className="absolute bottom-0 left-0 top-0 w-[3px] bg-warning" />
          <View className="mt-px">
            <ClockIcon size={16} color={palette.warning} />
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-[13px] tracking-[-0.1px] text-warning-strong">
              {block.title}
            </Text>
            <Text className="mt-1 font-regular text-[12px] leading-[17px] text-warning-muted">
              {block.text}
            </Text>
          </View>
        </View>
      );
  }
}
