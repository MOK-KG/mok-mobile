import { act, renderHook } from '@testing-library/react-native';
import { useState } from 'react';
import { useMentions } from './MentionSuggestions';
import type { ChatMember } from './types';

const member = (id: string, name: string, short: string): ChatMember => ({
  id,
  name,
  short,
  tone: 'blue',
  role: 'R5',
  department: 'Юридический отдел',
});

const mockMembers: Record<string, ChatMember> = {
  'u-ad': member('u-ad', 'Айбек Дуйшеев', 'А. Дуйшеев'),
  'u-nb': member('u-nb', 'Нурлан Бакиров', 'Н. Бакиров'),
  'u-dt': member('u-dt', 'Дамира Токтосунова', 'Д. Токтосунова'),
};

jest.mock('./api', () => ({ useChatMembers: () => mockMembers }));
jest.mock('@/features/auth', () => ({ useCurrentPersonId: () => 'u-ad' }));
jest.mock('@/features/tasks/parts', () => ({ Avatar: () => null }));

const select = (start: number) => ({ nativeEvent: { selection: { start, end: start } } }) as never;

function setup(memberIds = ['u-ad', 'u-nb', 'u-dt']) {
  return renderHook(() => {
    const [text, setText] = useState('');
    return { text, ...useMentions(memberIds, text, setText) };
  });
}

describe('useMentions', () => {
  it('lists chat members except me after @', async () => {
    const { result } = await setup();
    await act(async () => {
      result.current.onChangeText('@');
      result.current.onSelectionChange(select(1));
    });
    expect(result.current.candidates.map((m: ChatMember) => m.id)).toEqual(['u-dt', 'u-nb']);
  });

  it('filters by what is typed and inserts the short name', async () => {
    const { result } = await setup();
    await act(async () => {
      result.current.onChangeText('Привет @бак');
      result.current.onSelectionChange(select(11));
    });
    expect(result.current.candidates.map((m: ChatMember) => m.id)).toEqual(['u-nb']);

    await act(async () => result.current.pick(result.current.candidates[0]));
    expect(result.current.text).toBe('Привет @Н. Бакиров ');
    expect(result.current.selection).toEqual({ start: 19, end: 19 });
    expect(result.current.candidates).toEqual([]);
  });

  it('only offers members of this chat', async () => {
    const { result } = await setup(['u-ad', 'u-dt']);
    await act(async () => {
      result.current.onChangeText('@');
      result.current.onSelectionChange(select(1));
    });
    expect(result.current.candidates.map((m: ChatMember) => m.id)).toEqual(['u-dt']);
  });

  it('shows nothing without @', async () => {
    const { result } = await setup();
    await act(async () => {
      result.current.onChangeText('Привет');
      result.current.onSelectionChange(select(6));
    });
    expect(result.current.candidates).toEqual([]);
  });
});
