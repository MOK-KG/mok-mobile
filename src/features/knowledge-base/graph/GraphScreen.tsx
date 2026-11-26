import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useCan } from '@/features/auth';
import { errorText } from '@/shared/api/feedback';
import { themes, toneNames } from '@/shared/config/tokens';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import { type GraphNode, type KnowledgeGraphData, useKnowledgeGraph } from './api';
import { KnowledgeGraph } from './KnowledgeGraph';

export function openGraphNode(node: GraphNode) {
  if (node.kind === 'article' && node.slug) router.push(`/knowledge/${node.slug}`);
  else if (node.taskId) router.push(`/tasks/${node.taskId}`);
}

export function GraphScreen() {
  const { t } = useTranslation();
  const { can } = useCan();
  const colors = themes[useTheme().theme];
  const { height } = useWindowDimensions();
  const [tasks, setTasks] = useState(false);
  const [suggested, setSuggested] = useState(false);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const graph = useKnowledgeGraph({ tasks: tasks && can('tasks.view'), suggested });

  const sections = useMemo(() => {
    const seen = new Map<string, string>();
    for (const n of graph.data?.nodes ?? []) {
      if (n.kind === 'article')
        seen.set(n.sectionId ?? '', n.sectionName || t('knowledge.noSection'));
    }
    const ids = [...seen.keys()].sort();
    return ids.map((id) => ({
      id,
      name: seen.get(id) ?? '',
      color: colors[`tone-${toneNames[ids.indexOf(id) % toneNames.length]}`],
    }));
  }, [graph.data, colors, t]);

  const shown: KnowledgeGraphData | null = useMemo(() => {
    if (!graph.data) return null;
    const articles = graph.data.nodes.filter(
      (n) => n.kind === 'article' && !hidden.has(n.sectionId ?? ''),
    );
    const ids = new Set(articles.map((n) => n.id));
    const links = graph.data.links.filter(
      (l) => ids.has(l.target) && (ids.has(l.source) || l.source.startsWith('task:')),
    );
    const taskIds = new Set(links.filter((l) => l.kind === 'task').map((l) => l.source));
    const nodes = [
      ...articles,
      ...graph.data.nodes.filter((n) => n.kind === 'task' && taskIds.has(n.id)),
    ];
    return { nodes, links };
  }, [graph.data, hidden]);

  const needle = query.trim().toLowerCase();
  const matches = useMemo(
    () =>
      needle && shown
        ? new Set(
            shown.nodes.filter((n) => n.title.toLowerCase().includes(needle)).map((n) => n.id),
          )
        : null,
    [needle, shown],
  );
  const articles = shown?.nodes.filter((n) => n.kind === 'article').length ?? 0;
  const links = shown?.links.filter((l) => l.kind === 'link').length ?? 0;

  const toggle = (id: string) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const chip = (on: boolean) =>
    `h-8 flex-row items-center gap-[6px] rounded-8 border px-3 ${
      on ? 'border-transparent bg-control-active' : 'border-line bg-panel'
    }`;
  const chipText = (on: boolean) =>
    `text-[12px] ${on ? 'font-medium text-text' : 'font-regular text-faint'}`;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScreenHeader title={t('knowledge.graph.title')} fallback="/knowledge" />
      <View className="gap-2 px-4 pt-2">
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('knowledge.graph.search')}
          placeholderTextColor={colors.dim}
          accessibilityLabel={t('knowledge.graph.search')}
          className="h-10 rounded-9 border border-line bg-panel px-3 font-regular text-[13.5px] text-text"
        />
        {shown && (
          <Text className="font-regular text-[12px] text-faint">
            {t('knowledge.graph.counts', { articles, links })}
          </Text>
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="max-h-12 grow-0"
        contentContainerClassName="items-center gap-[7px] px-4 py-2"
      >
        {can('tasks.view') && (
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: tasks }}
            onPress={() => setTasks((v) => !v)}
            className={chip(tasks)}
          >
            <View className={`size-2 rounded-full ${tasks ? 'bg-tone-orange' : 'bg-dim'}`} />
            <Text className={chipText(tasks)}>{t('knowledge.graph.tasks')}</Text>
          </Pressable>
        )}
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: suggested }}
          onPress={() => setSuggested((v) => !v)}
          className={chip(suggested)}
        >
          <Text className={chipText(suggested)}>{t('knowledge.graph.suggested')}</Text>
        </Pressable>
        {sections.map((s) => {
          const on = !hidden.has(s.id);
          return (
            <Pressable
              key={s.id || 'none'}
              accessibilityRole="switch"
              accessibilityState={{ checked: on }}
              onPress={() => toggle(s.id)}
              className={chip(on)}
            >
              <View
                style={{ backgroundColor: on ? s.color : colors.dim }}
                className="size-2 rounded-full"
              />
              <Text className={chipText(on)}>{s.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <View className="mx-4 mb-4 flex-1 overflow-hidden rounded-14 border border-line bg-panel">
        {graph.isError ? (
          <Text className="mt-16 text-center font-regular text-[13px] text-dim">
            {errorText(graph.error, t)}
          </Text>
        ) : shown && shown.nodes.length === 0 ? (
          <Text className="mt-16 text-center font-regular text-[13px] text-dim">
            {t('knowledge.graph.empty')}
          </Text>
        ) : (
          shown && (
            <KnowledgeGraph
              data={shown}
              height={Math.max(320, height - 260)}
              matches={matches}
              onOpen={openGraphNode}
            />
          )
        )}
      </View>
    </SafeAreaView>
  );
}

export function LocalGraph({ slug }: { slug: string }) {
  const { t } = useTranslation();
  const { can } = useCan();
  const [depth, setDepth] = useState<1 | 2>(1);
  const graph = useKnowledgeGraph({ article: slug, depth, tasks: can('tasks.view') });
  const data = graph.data;
  const me = `doc:${slug}`;
  if (!data) return null;
  const backlinks = data.nodes.filter((n) =>
    data.links.some((l) => l.kind === 'link' && l.target === me && l.source === n.id),
  );
  if (data.nodes.length <= 1) {
    return (
      <Text className="font-regular text-[12.5px] text-dim">{t('knowledge.graph.noLinks')}</Text>
    );
  }
  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-1">
        {([1, 2] as const).map((d) => (
          <Pressable
            key={d}
            accessibilityRole="button"
            accessibilityState={{ selected: depth === d }}
            onPress={() => setDepth(d)}
            className={`h-7 justify-center rounded-6 px-2 ${depth === d ? 'bg-control-active' : ''}`}
          >
            <Text
              className={`text-[12px] ${depth === d ? 'font-medium text-text' : 'font-regular text-faint'}`}
            >
              {t('knowledge.graph.depth', { count: d })}
            </Text>
          </Pressable>
        ))}
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push('/knowledge/graph')}
          className="ml-auto"
          hitSlop={6}
        >
          <Text className="font-medium text-[12.5px] text-info">
            {t('knowledge.graph.openGlobal')}
          </Text>
        </Pressable>
      </View>
      <View className="overflow-hidden rounded-9 border border-line bg-surface">
        <KnowledgeGraph
          data={data}
          height={240}
          focusId={me}
          labels="always"
          onOpen={openGraphNode}
        />
      </View>
      <Text className="mt-1 font-semibold text-[10.5px] uppercase tracking-[1px] text-dim">
        {t('knowledge.graph.backlinks')} {backlinks.length}
      </Text>
      {backlinks.length === 0 ? (
        <Text className="font-regular text-[12.5px] text-dim">
          {t('knowledge.graph.noBacklinks')}
        </Text>
      ) : (
        backlinks.map((n) => (
          <Pressable
            key={n.id}
            accessibilityRole="link"
            onPress={() => openGraphNode(n)}
            className="py-1"
          >
            <Text numberOfLines={1} className="font-regular text-[13px] text-info">
              {n.title}
            </Text>
          </Pressable>
        ))
      )}
    </View>
  );
}
