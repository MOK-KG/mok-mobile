import { fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { Linking } from 'react-native';
import { renderScreen } from '@/test/render';
import { Markdown, parseInline, parseMarkdown } from './Markdown';

it('splits markdown into headings, lists, quotes, code and tables', () => {
  const blocks = parseMarkdown(
    '# Отчёт\n\nТекст **важно**\n\n- раз\n- [x] два\n\n> цитата\n\n```\n# не заголовок\n```\n\n| A | B |\n|---|---|\n| 1 | 2 |',
  );
  expect(blocks.map((b) => b.kind)).toEqual([
    'heading',
    'paragraph',
    'list',
    'quote',
    'code',
    'table',
  ]);
  expect(blocks[4]).toEqual({ kind: 'code', text: '# не заголовок' });
  expect(blocks[5]).toEqual({
    kind: 'table',
    rows: [
      ['A', 'B'],
      ['1', '2'],
    ],
  });
});

it('parses inline bold, code, links and wiki links', () => {
  expect(parseInline('**ж** `к` [сайт](https://noc.kg) [[Устав]]').map((n) => n.kind)).toEqual([
    'bold',
    'text',
    'code',
    'text',
    'link',
    'text',
    'link',
  ]);
});

it('opens external links in the browser and article links in the app', async () => {
  const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  await renderScreen(
    <Markdown
      text="См. [сайт](https://noc.kg) и [[Устав]], а также [[Нет такой]]"
      resolveLink={(target) => (target === 'Устав' ? '/knowledge/ustav' : null)}
    />,
  );
  await fireEvent.press(screen.getByText('сайт'));
  expect(open).toHaveBeenCalledWith('https://noc.kg');
  await fireEvent.press(screen.getByText('Устав'));
  expect(router.push).toHaveBeenCalledWith('/knowledge/ustav');
  expect(screen.getByText('Нет такой').props.accessibilityRole).toBeUndefined();
});
