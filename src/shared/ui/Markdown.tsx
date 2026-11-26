import { type Href, router } from 'expo-router';
import type { ReactNode } from 'react';
import { Linking, ScrollView, Text, View } from 'react-native';

export type ResolveLink = (target: string) => string | null;

type Block =
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; ordered: boolean; items: { text: string; checked: boolean | null }[] }
  | { kind: 'quote'; text: string }
  | { kind: 'code'; text: string }
  | { kind: 'table'; rows: string[][] }
  | { kind: 'rule' };

const FENCE = /^\s*(```|~~~)/;
const HEADING = /^(#{1,6})\s+(.*)$/;
const LIST = /^\s*([-*+]|\d+[.)])\s+(.*)$/;
const TASK = /^\[([ xX])\]\s+(.*)$/;
const QUOTE = /^\s*>\s?(.*)$/;
const TABLE = /^\s*\|.*\|\s*$/;
const TABLE_RULE = /^\s*\|?\s*:?-{2,}/;
const RULE = /^\s*([-*_])(\s*\1){2,}\s*$/;
const WIKI = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

export function parseMarkdown(source: string): Block[] {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '') {
      i += 1;
      continue;
    }
    if (FENCE.test(line)) {
      const code: string[] = [];
      i += 1;
      while (i < lines.length && !FENCE.test(lines[i])) {
        code.push(lines[i]);
        i += 1;
      }
      i += 1;
      blocks.push({ kind: 'code', text: code.join('\n') });
      continue;
    }
    const heading = HEADING.exec(line);
    if (heading) {
      blocks.push({ kind: 'heading', level: heading[1].length, text: heading[2].trim() });
      i += 1;
      continue;
    }
    if (RULE.test(line)) {
      blocks.push({ kind: 'rule' });
      i += 1;
      continue;
    }
    if (TABLE.test(line)) {
      const rows: string[][] = [];
      while (i < lines.length && TABLE.test(lines[i])) {
        if (!TABLE_RULE.test(lines[i])) {
          rows.push(
            lines[i]
              .trim()
              .replace(/^\||\|$/g, '')
              .split('|')
              .map((c) => c.trim()),
          );
        }
        i += 1;
      }
      blocks.push({ kind: 'table', rows });
      continue;
    }
    if (LIST.test(line)) {
      const ordered = /^\s*\d/.test(line);
      const items: { text: string; checked: boolean | null }[] = [];
      while (i < lines.length && LIST.test(lines[i])) {
        const text = LIST.exec(lines[i])?.[2] ?? '';
        const task = TASK.exec(text);
        items.push(
          task
            ? { text: task[2], checked: task[1].toLowerCase() === 'x' }
            : { text, checked: null },
        );
        i += 1;
      }
      blocks.push({ kind: 'list', ordered, items });
      continue;
    }
    if (QUOTE.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && QUOTE.test(lines[i])) {
        quote.push(QUOTE.exec(lines[i])?.[1] ?? '');
        i += 1;
      }
      blocks.push({ kind: 'quote', text: quote.join('\n').trim() });
      continue;
    }
    const paragraph: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !FENCE.test(lines[i]) &&
      !HEADING.test(lines[i]) &&
      !LIST.test(lines[i]) &&
      !QUOTE.test(lines[i]) &&
      !TABLE.test(lines[i])
    ) {
      paragraph.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ kind: 'paragraph', text: paragraph.join('\n') });
  }
  return blocks;
}

type Inline =
  | { kind: 'text'; value: string }
  | { kind: 'bold'; children: Inline[] }
  | { kind: 'italic'; children: Inline[] }
  | { kind: 'strike'; children: Inline[] }
  | { kind: 'code'; value: string }
  | { kind: 'link'; children: Inline[]; href: string };

const INLINE =
  /(`[^`]+`)|(\*\*[^*]+\*\*|__[^_]+__)|(~~[^~]+~~)|(\*[^*\s][^*]*\*|_[^_\s][^_]*_)|(\[[^\]]+\]\([^)\s]+\))|(https?:\/\/[^\s<>()]+[^\s<>().,;:!?])/;

export function parseInline(source: string): Inline[] {
  const text = source.replace(WIKI, (_, target: string, label?: string) => {
    const name = (label ?? target).trim();
    return `[${name}](wiki:${encodeURIComponent(target.trim())})`;
  });
  const out: Inline[] = [];
  let rest = text;
  while (rest) {
    const match = INLINE.exec(rest);
    if (!match) {
      out.push({ kind: 'text', value: rest });
      break;
    }
    if (match.index > 0) out.push({ kind: 'text', value: rest.slice(0, match.index) });
    const token = match[0];
    if (match[1]) out.push({ kind: 'code', value: token.slice(1, -1) });
    else if (match[2]) out.push({ kind: 'bold', children: parseInline(token.slice(2, -2)) });
    else if (match[3]) out.push({ kind: 'strike', children: parseInline(token.slice(2, -2)) });
    else if (match[4]) out.push({ kind: 'italic', children: parseInline(token.slice(1, -1)) });
    else if (match[5]) {
      const label = token.slice(1, token.indexOf(']('));
      const href = token.slice(token.indexOf('](') + 2, -1);
      out.push({ kind: 'link', children: parseInline(label), href });
    } else out.push({ kind: 'link', children: [{ kind: 'text', value: token }], href: token });
    rest = rest.slice(match.index + token.length);
  }
  return out;
}

function openLink(href: string, resolveLink?: ResolveLink) {
  if (/^(https?:|mailto:)/i.test(href)) {
    Linking.openURL(href);
    return;
  }
  const target = href.startsWith('wiki:') ? decodeURIComponent(href.slice(5)) : href;
  const to = href.startsWith('/') ? href : (resolveLink?.(target) ?? null);
  if (to) router.push(to as Href);
}

function linkable(href: string, resolveLink?: ResolveLink) {
  if (/^(https?:|mailto:)/i.test(href) || href.startsWith('/')) return true;
  const target = href.startsWith('wiki:') ? decodeURIComponent(href.slice(5)) : href;
  return Boolean(resolveLink?.(target));
}

function renderInline(nodes: Inline[], resolveLink?: ResolveLink): ReactNode[] {
  return nodes.map((n, i) => {
    switch (n.kind) {
      case 'text':
        return n.value;
      case 'bold':
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: части текста не переставляются
          <Text key={i} className="font-semibold text-text">
            {renderInline(n.children, resolveLink)}
          </Text>
        );
      case 'italic':
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: части текста не переставляются
          <Text key={i} style={{ fontStyle: 'italic' }}>
            {renderInline(n.children, resolveLink)}
          </Text>
        );
      case 'strike':
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: части текста не переставляются
          <Text key={i} style={{ textDecorationLine: 'line-through' }}>
            {renderInline(n.children, resolveLink)}
          </Text>
        );
      case 'code':
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: части текста не переставляются
          <Text key={i} className="rounded-[4px] bg-control font-medium text-[12.5px] text-text">
            {n.value}
          </Text>
        );
      default:
        return linkable(n.href, resolveLink) ? (
          <Text
            // biome-ignore lint/suspicious/noArrayIndexKey: части текста не переставляются
            key={i}
            accessibilityRole="link"
            onPress={() => openLink(n.href, resolveLink)}
            className="text-info underline"
          >
            {renderInline(n.children, resolveLink)}
          </Text>
        ) : (
          // biome-ignore lint/suspicious/noArrayIndexKey: части текста не переставляются
          <Text key={i} className="text-text">
            {renderInline(n.children, resolveLink)}
          </Text>
        );
    }
  });
}

const headingSize: Record<number, string> = {
  1: 'text-[19px]',
  2: 'text-[17px]',
  3: 'text-[15.5px]',
};

export function Markdown({
  text,
  size = 'article',
  resolveLink,
}: {
  text: string;
  size?: 'article' | 'compact';
  resolveLink?: ResolveLink;
}) {
  const body =
    size === 'article'
      ? 'font-regular text-[14px] leading-[22px] text-sub'
      : 'font-regular text-[14px] leading-[20px] text-sub';
  const inline = (value: string) => renderInline(parseInline(value), resolveLink);
  return (
    <View className="gap-2">
      {parseMarkdown(text).map((block, i) => {
        const key = `${block.kind}-${i}`;
        switch (block.kind) {
          case 'heading':
            return (
              <Text
                key={key}
                accessibilityRole="header"
                className={`font-semibold tracking-[-0.2px] text-text ${
                  headingSize[block.level] ?? 'text-[14.5px]'
                } ${i > 0 ? 'mt-2' : ''}`}
              >
                {inline(block.text)}
              </Text>
            );
          case 'paragraph':
            return (
              <Text key={key} className={body}>
                {inline(block.text)}
              </Text>
            );
          case 'list':
            return (
              <View key={key} className="gap-[6px]">
                {block.items.map((item, n) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: пункты не переставляются
                  <View key={n} className="flex-row gap-2 pl-1">
                    <Text className={`${body} w-5 text-faint`}>
                      {item.checked === null
                        ? block.ordered
                          ? `${n + 1}.`
                          : '•'
                        : item.checked
                          ? '☑'
                          : '☐'}
                    </Text>
                    <Text className={`${body} flex-1`}>{inline(item.text)}</Text>
                  </View>
                ))}
              </View>
            );
          case 'quote':
            return (
              <View key={key} className="border-l-[3px] border-line pl-3">
                <Text className={`${body} text-faint`}>{inline(block.text)}</Text>
              </View>
            );
          case 'code':
            return (
              <ScrollView
                key={key}
                horizontal
                className="rounded-9 border border-line bg-column"
                contentContainerClassName="px-3 py-2"
              >
                <Text className="font-regular text-[12.5px] leading-[18px] text-text">
                  {block.text}
                </Text>
              </ScrollView>
            );
          case 'table':
            return (
              <ScrollView key={key} horizontal className="rounded-9 border border-line">
                <View>
                  {block.rows.map((row, r) => (
                    <View
                      // biome-ignore lint/suspicious/noArrayIndexKey: строки не переставляются
                      key={r}
                      className={`flex-row ${r > 0 ? 'border-t border-line' : 'bg-column'}`}
                    >
                      {row.map((cell, c) => (
                        <Text
                          // biome-ignore lint/suspicious/noArrayIndexKey: ячейки не переставляются
                          key={c}
                          className={`w-[140px] px-3 py-2 text-[12.5px] ${
                            r === 0 ? 'font-semibold text-text' : 'font-regular text-sub'
                          }`}
                        >
                          {inline(cell)}
                        </Text>
                      ))}
                    </View>
                  ))}
                </View>
              </ScrollView>
            );
          default:
            return <View key={key} className="my-1 h-px bg-line" />;
        }
      })}
    </View>
  );
}
