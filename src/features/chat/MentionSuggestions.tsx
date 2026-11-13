import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  type NativeSyntheticEvent,
  Pressable,
  Text,
  type TextInputSelectionChangeEventData,
  View,
} from 'react-native';
import { useCurrentPersonId } from '@/features/auth';
import { Avatar } from '@/features/tasks/parts';
import { useChatMembers } from './api';
import { insertMention, mentionAt, mentionCandidates } from './mentions';
import type { ChatMember } from './types';

type Selection = { start: number; end: number };

export function useMentions(memberIds: string[], text: string, setText: (text: string) => void) {
  const members = useChatMembers();
  const me = useCurrentPersonId();
  const [caret, setCaret] = useState(0);
  const [selection, setSelection] = useState<Selection | undefined>();

  const people = useMemo(
    () =>
      memberIds
        .filter((id) => id !== me)
        .map((id) => members[id])
        .filter((m): m is ChatMember => Boolean(m)),
    [memberIds, members, me],
  );
  const draft = mentionAt(text, caret);
  const candidates = draft ? mentionCandidates(people, draft.query) : [];

  return {
    candidates,
    selection,
    onChangeText: (value: string) => {
      setText(value);
      if (value.length < caret) setCaret(value.length);
    },
    onSelectionChange: (e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
      setCaret(e.nativeEvent.selection.start);
      setSelection(undefined);
    },
    pick: (member: ChatMember) => {
      if (!draft) return;
      const next = insertMention(text, draft, member);
      setText(next.text);
      setCaret(next.caret);
      setSelection({ start: next.caret, end: next.caret });
    },
  };
}

export function MentionSuggestions({
  candidates,
  onPick,
}: {
  candidates: ChatMember[];
  onPick: (member: ChatMember) => void;
}) {
  const { t } = useTranslation();
  if (candidates.length === 0) return null;
  return (
    <View
      accessibilityRole="list"
      accessibilityLabel={t('chat.mentionList')}
      className="mb-2 overflow-hidden rounded-11 border border-line bg-surface"
    >
      {candidates.map((m) => (
        <Pressable
          key={m.id}
          accessibilityRole="button"
          accessibilityLabel={m.name}
          onPress={() => onPick(m)}
          className="flex-row items-center gap-[10px] px-3 py-2 active:bg-control-active"
        >
          <Avatar person={m} size={28} />
          <View className="min-w-0 flex-1">
            <Text numberOfLines={1} className="font-medium text-[14px] text-text">
              {m.name}
            </Text>
            <Text numberOfLines={1} className="font-regular text-[12px] text-sub">
              {m.department}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}
