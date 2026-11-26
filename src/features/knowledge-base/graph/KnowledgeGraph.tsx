import { useMemo, useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';
import { useTheme } from '@/app/providers/ThemeProvider';
import { themes, toneNames } from '@/shared/config/tokens';
import type { GraphNode, KnowledgeGraphData } from './api';
import { layoutGraph } from './layout';

const LABELS_FOR = 14;

export function KnowledgeGraph({
  data,
  height,
  focusId,
  matches,
  labels = 'auto',
  onOpen,
}: {
  data: KnowledgeGraphData;
  height: number;
  focusId?: string;
  matches?: Set<string> | null;
  labels?: 'always' | 'auto';
  onOpen: (node: GraphNode) => void;
}) {
  const colors = themes[useTheme().theme];
  const [width, setWidth] = useState(0);
  const pos = useMemo(
    () => (width > 0 ? layoutGraph(data, width, height, focusId) : new Map()),
    [data, width, height, focusId],
  );
  const sectionColor = useMemo(() => {
    const ids = [...new Set(data.nodes.map((n) => n.sectionId ?? ''))].sort();
    return (id: string | null | undefined) =>
      colors[`tone-${toneNames[Math.max(0, ids.indexOf(id ?? '')) % toneNames.length]}`];
  }, [data.nodes, colors]);
  const labelled = useMemo(() => {
    if (labels === 'always' || data.nodes.length <= LABELS_FOR) {
      return new Set(data.nodes.map((n) => n.id));
    }
    const top = [...data.nodes].sort((a, b) => b.degree - a.degree).slice(0, LABELS_FOR);
    return new Set(top.map((n) => n.id));
  }, [data.nodes, labels]);
  const radius = (n: GraphNode) => Math.min(4 + Math.sqrt(n.degree) * 2.2, 14);
  const dim = (id: string) => (matches ? !matches.has(id) : false);

  return (
    <View style={{ height }} onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width))}>
      {width > 0 && (
        <Svg width={width} height={height}>
          {data.links.map((l) => {
            const a = pos.get(l.source);
            const b = pos.get(l.target);
            if (!a || !b) return null;
            const faded = dim(l.source) && dim(l.target);
            return (
              <Line
                key={`${l.source}-${l.target}-${l.kind}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={l.kind === 'task' ? colors['tone-orange'] : colors.faint}
                strokeOpacity={faded ? 0.15 : 0.6}
                strokeWidth={l.kind === 'suggested' ? 0.7 : 1}
                strokeDasharray={l.kind === 'suggested' ? [3, 3] : undefined}
              />
            );
          })}
          {data.nodes.map((n) => {
            const p = pos.get(n.id);
            if (!p) return null;
            const r = radius(n);
            const fill =
              n.kind === 'task'
                ? colors['tone-orange']
                : n.personal
                  ? colors.info
                  : sectionColor(n.sectionId);
            const faded = dim(n.id);
            return (
              <G key={n.id} onPress={() => onOpen(n)} opacity={faded ? 0.25 : 1}>
                <Circle cx={p.x} cy={p.y} r={r + 8} fill="transparent" />
                <Circle
                  cx={p.x}
                  cy={p.y}
                  r={r}
                  fill={fill}
                  stroke={n.id === focusId || (matches?.has(n.id) ?? false) ? colors.text : 'none'}
                  strokeWidth={2}
                />
                {(labelled.has(n.id) || n.id === focusId || (matches?.has(n.id) ?? false)) && (
                  <SvgText
                    x={p.x}
                    y={p.y + r + 11}
                    fontSize={10}
                    fill={colors.sub}
                    textAnchor="middle"
                  >
                    {n.title.length > 24 ? `${n.title.slice(0, 23)}…` : n.title}
                  </SvgText>
                )}
              </G>
            );
          })}
        </Svg>
      )}
    </View>
  );
}
