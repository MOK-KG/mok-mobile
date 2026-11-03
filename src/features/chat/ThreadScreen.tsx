import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/app/providers/ThemeProvider';
import { Avatar } from '@/features/tasks/parts';
import { themes } from '@/shared/config/tokens';
import { formatInBishkek } from '@/shared/lib/date';
import { SendIcon } from '@/shared/ui/icons';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import { chatMembers, threadsOf, useChats, useMessages, useSendMessage } from './api';
import type { ChatMessage } from './types';

/** Ветка ответов к сообщению канала (S-33): сообщение, ответы и поле ответа */
export function ThreadScreen({ chatId, rootId }: { chatId: string; rootId: string }) {
  const { t } = useTranslation();
  const palette = themes[useTheme().theme];
  const chat = useChats().data?.find((c) => c.id === chatId);
  const all = useMessages(chatId).data ?? [];
  const root = all.find((m) => m.id === rootId);
  const replies = threadsOf(all).get(rootId) ?? [];
  const send = useSendMessage();
  const [text, setText] = useState('');
  const submit = () => {
    const clean = text.trim();
    if (!clean) return;
    send.mutate({ chatId, message: { kind: 'text', text: clean, threadId: rootId } });
    setText('');
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-canvas">
      <ScreenHeader title={t('chat.thread.title')} fallback="/chat" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerClassName="gap-3 px-4 pb-4 pt-2">
          {chat && <Text className="font-regular text-[12px] text-faint">{chat.fullTitle}</Text>}
          {root && <Row message={root} />}
          <Text className="font-regular text-[11px] text-dim">
            {t('chat.thread.replies', { count: replies.length })}
          </Text>
          {replies.map((r) => (
            <Row key={r.id} message={r} />
          ))}
        </ScrollView>
        <View className="flex-row items-end gap-2 border-t border-line bg-panel px-3 py-2">
          <TextInput
            multiline
            value={text}
            onChangeText={setText}
            placeholder={t('chat.thread.placeholder')}
            placeholderTextColor={palette.dim}
            accessibilityLabel={t('chat.thread.placeholder')}
            className="max-h-28 min-h-10 flex-1 rounded-9 border border-line bg-column px-3 py-2 font-regular text-[14px] text-text"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('chat.send')}
            onPress={submit}
            disabled={!text.trim()}
            className={`size-10 items-center justify-center rounded-9 bg-brand-red ${
              text.trim() ? '' : 'opacity-50'
            }`}
          >
            <SendIcon size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Row({ message: m }: { message: ChatMessage }) {
  const { i18n } = useTranslation();
  const author = m.authorId ? chatMembers[m.authorId] : undefined;
  return (
    <View className="flex-row gap-[10px]">
      {author ? <Avatar person={author} size={32} /> : <View className="w-8" />}
      <View className="min-w-0 flex-1">
        <Text className="font-semibold text-[13px] text-text">
          {author?.name ?? ''}{' '}
          <Text className="font-regular text-[11px] text-dim">
            {formatInBishkek(m.at, 'd MMM, HH:mm', i18n.language)}
          </Text>
        </Text>
        {!!m.text && (
          <Text className="font-regular text-[14px] leading-[20px] text-sub">{m.text}</Text>
        )}
      </View>
    </View>
  );
}
