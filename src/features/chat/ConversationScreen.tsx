import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Notice, NoticeText, statusChip, usePalette } from '@/features/tasks/parts';
import { useOpenTaskByTitle } from '@/features/tasks/useOpenTaskByTitle';
import { formatInBishkek, formatIsoDate } from '@/shared/lib/date';
import {
  AttachLargeIcon,
  BoltMediumIcon,
  ChevronLeftIcon,
  MoreIcon,
  PaperclipIcon,
  PlaneMediumIcon,
  SendIcon,
  TasksIcon,
  TasksMiniIcon,
} from '@/shared/ui/icons';
import { Tooltip } from '@/shared/ui/Tooltip';
import {
  chatMembers,
  threadsOf,
  useChats,
  useMarkChatRead,
  useMessages,
  useSendMessage,
  useSetMuted,
} from './api';
import { ChatBadge, dayLabel, dayOf, peerSubtitle } from './parts';
import { TaskPickerSheet } from './TaskPickerSheet';
import type { ChatMessage, ChatSummary } from './types';

/** Сообщения одного автора подряд в пределах 5 минут — под одной шапкой */
const GROUP_MS = 5 * 60_000;

type Row =
  | { kind: 'day'; key: string; day: string }
  | { kind: 'message'; key: string; message: ChatMessage; head: boolean };

function toRows(messages: ChatMessage[]): Row[] {
  const rows: Row[] = [];
  let prev: ChatMessage | null = null;
  for (const m of messages) {
    const day = dayOf(m.at);
    const newDay = !prev || dayOf(prev.at) !== day;
    if (newDay) rows.push({ kind: 'day', key: `day-${day}`, day });
    const head =
      newDay ||
      !prev ||
      m.authorId === null ||
      prev.authorId !== m.authorId ||
      Date.parse(m.at) - Date.parse(prev.at) > GROUP_MS;
    rows.push({ kind: 'message', key: m.id, message: m, head });
    prev = m;
  }
  return rows;
}

/** Переписка: канал департамента или личная (макет: «Мобильный чат · переписка») */
export function ConversationScreen({ chatId }: { chatId: string }) {
  const { t } = useTranslation();
  const chats = useChats();
  const chat = chats.data?.find((c) => c.id === chatId);

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-canvas">
      {chat ? (
        <Conversation chat={chat} />
      ) : (
        <>
          <Header chat={null} />
          <Text className="py-10 text-center font-regular text-[13px] text-sub">
            {chats.isPending ? '' : t('chat.nothingFound')}
          </Text>
        </>
      )}
    </SafeAreaView>
  );
}

function Conversation({ chat }: { chat: ChatSummary }) {
  const { t } = useTranslation();
  const messages = useMessages(chat.id);
  const markRead = useMarkChatRead();
  const scroll = useRef<ScrollView>(null);
  // Ответы в ветках — не в общей ленте, а «N ответов» под сообщением (S-33)
  const rows = useMemo(
    () => toRows((messages.data ?? []).filter((m) => !m.threadId)),
    [messages.data],
  );
  const threads = useMemo(() => threadsOf(messages.data ?? []), [messages.data]);
  const lastId = messages.data?.at(-1)?.id;

  // Прочитано — при открытии и при каждом новом сообщении, пока переписка на экране
  const { mutate: mark } = markRead;
  useEffect(() => {
    if (lastId) mark(chat.id);
  }, [lastId, chat.id, mark]);

  return (
    <>
      <Header chat={chat} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scroll}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}
          contentContainerClassName="grow justify-end gap-3 px-4 pb-4 pt-2"
        >
          {!messages.isPending && rows.length === 0 && (
            <Text className="py-10 text-center font-regular text-[13px] text-dim">
              {t('chat.noMessages')}
            </Text>
          )}
          {rows.map((row) =>
            row.kind === 'day' ? (
              <DaySeparator key={row.key} day={row.day} />
            ) : (
              <MessageRow
                key={row.key}
                chat={chat}
                message={row.message}
                head={row.head}
                replies={threads.get(row.message.id)?.length ?? 0}
              />
            ),
          )}
        </ScrollView>
        <Composer chat={chat} />
      </KeyboardAvoidingView>
    </>
  );
}

function Header({ chat }: { chat: ChatSummary | null }) {
  const { t, i18n } = useTranslation();
  const palette = usePalette();
  const setMuted = useSetMuted();
  const subtitle = !chat
    ? ''
    : chat.kind === 'channel'
      ? t('chat.members', { count: chat.memberIds.length })
      : peerSubtitle(chat.peerId, t, i18n.language, true);

  const menu = () => {
    if (!chat) return;
    Alert.alert(chat.fullTitle, undefined, [
      {
        text: chat.muted ? t('chat.unmute') : t('chat.mute'),
        onPress: () => setMuted.mutate({ chatId: chat.id, muted: !chat.muted }),
      },
      { text: t('chat.close'), style: 'cancel' },
    ]);
  };

  return (
    <View className="h-[56px] flex-row items-center gap-2 border-b border-line bg-panel px-3">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('chat.back')}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/chat'))}
        hitSlop={8}
        className="size-8 items-center justify-center rounded-8"
      >
        <ChevronLeftIcon size={20} color={palette.sub} />
      </Pressable>
      {chat && <ChatBadge chat={chat} size={30} />}
      <View className="min-w-0 flex-1">
        <Text
          accessibilityRole="header"
          numberOfLines={1}
          className="font-semibold text-[15px] tracking-[-0.3px] text-text"
        >
          {chat?.title}
        </Text>
        {!!subtitle && (
          <Text numberOfLines={1} className="font-regular text-[11px] text-dim">
            {subtitle}
            {chat?.muted ? ` · ${t('chat.muted')}` : ''}
          </Text>
        )}
      </View>
      {chat && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={chat.muted ? t('chat.unmute') : t('chat.mute')}
          onPress={menu}
          hitSlop={8}
          className="size-8 items-center justify-center rounded-8"
        >
          <MoreIcon size={18} color={palette.faint} />
        </Pressable>
      )}
    </View>
  );
}

function DaySeparator({ day }: { day: string }) {
  const { t, i18n } = useTranslation();
  return (
    <Text
      accessibilityRole="header"
      className="pt-1 text-center font-medium text-[11px] tracking-[0.2px] text-dim"
    >
      {dayLabel(day, t, i18n.language)}
    </Text>
  );
}

function MessageRow({
  chat,
  message: m,
  head,
  replies = 0,
}: {
  chat: ChatSummary;
  message: ChatMessage;
  head: boolean;
  /** Ответов в ветке; ветки — только в каналах */
  replies?: number;
}) {
  const { t, i18n } = useTranslation();
  const palette = usePalette();
  if (m.kind === 'system') {
    if (m.system?.kind === 'autoreply') {
      const peer = chat.peerId ? chatMembers[chat.peerId] : undefined;
      return (
        <Notice tone="info" Icon={PlaneMediumIcon} title={t('chat.autoreplyTitle')}>
          <NoticeText>
            {t('chat.autoreplyText', {
              name: peer?.short ?? chat.title,
              date: formatIsoDate(m.system.title, 'd MMMM', i18n.language),
              deputy: m.text,
            })}
          </NoticeText>
        </Notice>
      );
    }
    return (
      <Notice tone="warning" stripe Icon={BoltMediumIcon} title={m.system?.title ?? ''}>
        <NoticeText>{m.text}</NoticeText>
      </Notice>
    );
  }

  const author = m.authorId ? chatMembers[m.authorId] : undefined;
  const time = formatInBishkek(m.at, 'HH:mm', i18n.language);
  return (
    <View className={`flex-row gap-[10px] ${head ? '' : '-mt-1'}`}>
      <View className="w-8">{head && author && <Avatar person={author} size={32} />}</View>
      <View className="min-w-0 flex-1">
        {head && (
          <View className="mb-[2px] flex-row items-center gap-[6px]">
            <Text numberOfLines={1} className="shrink font-semibold text-[13px] text-text">
              {author?.name ?? ''}
            </Text>
            {author && (
              <Text
                accessibilityLabel={t(`access.roles.${author.role}`)}
                className="overflow-hidden rounded-[4px] border border-line px-[4px] py-px font-medium text-[9.5px] text-dim"
              >
                {author.role}
              </Text>
            )}
            <Text className="font-regular text-[11px] text-dim">{time}</Text>
          </View>
        )}
        {m.kind === 'task' && m.task ? (
          <TaskCard task={m.task} />
        ) : (
          <>
            {!!m.text && (
              <Text className="font-regular text-[14px] leading-[20px] text-sub">{m.text}</Text>
            )}
            {m.file && (
              <View className="mt-1 h-9 flex-row items-center gap-2 self-start rounded-8 border border-line bg-surface px-3">
                <AttachLargeIcon size={16} color={palette.faint} />
                <Text numberOfLines={1} className="shrink font-regular text-[13px] text-sub">
                  {m.file.name}
                </Text>
                {!!m.file.ext && (
                  <Text className="font-regular text-[11px] text-dim">{m.file.ext}</Text>
                )}
              </View>
            )}
          </>
        )}
        {chat.kind === 'channel' && m.kind === 'text' && (
          <Pressable
            accessibilityRole="link"
            hitSlop={6}
            onPress={() => router.push(`/chat/thread/${m.id}?chat=${chat.id}`)}
            className="mt-1 self-start"
          >
            <Text
              className={`text-[12.5px] ${replies > 0 ? 'font-medium text-info' : 'font-regular text-faint'}`}
            >
              {replies > 0 ? t('chat.thread.replies', { count: replies }) : t('chat.thread.reply')}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function TaskCard({ task }: { task: NonNullable<ChatMessage['task']> }) {
  const { t, i18n } = useTranslation();
  const palette = usePalette();
  const openTask = useOpenTaskByTitle();
  const meta = task.due
    ? t('chat.taskMeta', {
        assignee: task.assignee,
        date: formatIsoDate(task.due, 'd MMM', i18n.language).replace('.', ''),
      })
    : t('chat.taskNoDue', { assignee: task.assignee });
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${t('chat.taskFromBoard')}: ${task.title}. ${t('chat.openTask')}`}
      onPress={() => openTask(task.title)}
      className="relative mt-1 overflow-hidden rounded-11 border border-info-line bg-surface py-[10px] pl-[14px] pr-3 active:opacity-80"
    >
      <View className="absolute bottom-0 left-0 top-0 w-[2.5px] bg-info" />
      <View className="flex-row items-center gap-[6px]">
        <TasksMiniIcon size={12} color={palette['info-text']} />
        <Text className="font-semibold text-[10px] uppercase tracking-[1.2px] text-info-text">
          {t('chat.taskFromBoard')}
        </Text>
      </View>
      <Text className="mt-[6px] font-medium text-[13.5px] tracking-[-0.1px] text-text">
        {task.title}
      </Text>
      <View className="mt-[6px] flex-row items-center gap-2">
        <Text
          className={`overflow-hidden rounded-[5px] px-[7px] py-[3px] font-medium text-[10.5px] ${statusChip[task.status]}`}
        >
          {t(`tasks.status.${task.status}`)}
        </Text>
        <Text numberOfLines={1} className="flex-1 font-regular text-[11px] text-dim">
          {meta}
        </Text>
      </View>
    </Pressable>
  );
}

function Composer({ chat }: { chat: ChatSummary }) {
  const { t } = useTranslation();
  const palette = usePalette();
  const send = useSendMessage();
  const [text, setText] = useState('');
  const sheet = useRef<BottomSheetModal>(null);
  // В мобильном макете и в канале — «Сообщение…»
  const placeholder = t('chat.placeholderDirect');
  const clean = text.trim();

  // Файл: в заглушке сохраняется только имя, как на web; загрузка — с бэкендом
  const attachFile = async () => {
    const picked = await DocumentPicker.getDocumentAsync({ multiple: true });
    if (picked.canceled) return;
    for (const asset of picked.assets) {
      const dot = asset.name.lastIndexOf('.');
      send.mutate({
        chatId: chat.id,
        message: {
          kind: 'text',
          text: '',
          file: {
            name: dot > 0 ? asset.name.slice(0, dot) : asset.name,
            ext: dot > 0 ? asset.name.slice(dot + 1).toLowerCase() : '',
          },
        },
      });
    }
  };
  const iconButton =
    'mb-[6px] size-8 items-center justify-center rounded-6 active:bg-control-active';

  const submit = () => {
    if (!clean) return;
    send.mutate({ chatId: chat.id, message: { kind: 'text', text: clean } });
    setText('');
  };

  return (
    <View className="border-t border-line bg-panel px-4 py-[10px]">
      <View className="min-h-11 flex-row items-end gap-1 rounded-11 border border-line bg-surface pl-[13px] pr-[6px]">
        <TextInput
          multiline
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor={palette.dim}
          accessibilityLabel={placeholder}
          className="max-h-32 min-h-11 flex-1 py-3 font-regular text-[14px] text-text"
        />
        <Tooltip content={t('chat.attachFile')}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('chat.attachFile')}
            onPress={attachFile}
            hitSlop={4}
            className={iconButton}
          >
            <PaperclipIcon size={17} color={palette.faint} />
          </Pressable>
        </Tooltip>
        <Tooltip content={t('chat.attachTask')}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('chat.attachTask')}
            onPress={() => sheet.current?.present()}
            hitSlop={4}
            className={iconButton}
          >
            <TasksIcon size={17} color={palette.faint} />
          </Pressable>
        </Tooltip>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('chat.send')}
          accessibilityState={{ disabled: !clean }}
          disabled={!clean}
          onPress={submit}
          hitSlop={6}
          className={`mb-[6px] size-8 items-center justify-center rounded-6 ${clean ? '' : 'opacity-40'}`}
        >
          <SendIcon size={17} color={palette.info} />
        </Pressable>
      </View>
      <TaskPickerSheet
        sheetRef={sheet}
        onPick={(task) =>
          send.mutate({
            chatId: chat.id,
            message: {
              kind: 'task',
              text: '',
              task: {
                title: task.title,
                status: task.status,
                assignee: task.assignee?.short ?? '—',
                due: task.due,
              },
            },
          })
        }
      />
    </View>
  );
}
