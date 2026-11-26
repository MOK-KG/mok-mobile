import { type Href, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useArticleLinks } from '@/features/knowledge-base/links';
import { errorText } from '@/shared/api/feedback';
import { themes } from '@/shared/config/tokens';
import {
  BookIcon,
  ExternalIcon,
  PlusIcon,
  SendIcon,
  SparkleIcon,
  TasksIcon,
} from '@/shared/ui/icons';
import { Markdown } from '@/shared/ui/Markdown';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import {
  type BotAction,
  type BotMessage,
  type BotSource,
  isThinking,
  useBot,
  useBotConversations,
  useDecideBotAction,
  useNewBotConversation,
  useSendToBot,
} from './bot';

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Bishkek',
  });

export function toMobilePath(url: string): string {
  const [path, query = ''] = url.split('?');
  const params = new URLSearchParams(query);
  if (path === '/tasks' && params.get('task')) return `/tasks/${params.get('task')}`;
  if (path === '/chat' && params.get('c')) return `/chat/${params.get('c')}`;
  return url;
}

export function openPath(url: string) {
  if (/^(https?:|mailto:)/i.test(url)) Linking.openURL(url);
  else router.push(toMobilePath(url) as Href);
}

export function BotAvatar({ size = 40 }: { size?: number }) {
  return (
    <View
      style={{ width: size, height: size }}
      className="items-center justify-center rounded-full bg-info"
    >
      <SparkleIcon size={size * 0.45} color="#FFFFFF" />
    </View>
  );
}

export function BotScreen() {
  const { t } = useTranslation();
  const palette = themes[useTheme().theme];
  const [asked, setAsked] = useState<number | null>(null);
  const bot = useBot(asked);
  const conversationId = bot.data?.conversation?.id ?? asked;
  const startNew = useNewBotConversation();
  const send = useSendToBot();
  const messages = bot.data?.messages ?? [];
  const thinking = isThinking(messages);
  const scroll = useRef<ScrollView>(null);

  const ask = (text: string, onDone?: () => void) =>
    send.mutate(
      { text, conversationId: conversationId ?? undefined },
      {
        onSuccess: (message) => {
          setAsked(message.conversationId);
          onDone?.();
        },
      },
    );

  // biome-ignore lint/correctness/useExhaustiveDependencies: прокрутка к каждому новому сообщению
  useEffect(() => {
    const timer = setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(timer);
  }, [messages.length, thinking]);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScreenHeader
        title={t('assistant.bot.title')}
        fallback="/chat"
        right={
          <View className="flex-row items-center gap-1">
            {bot.data?.notesUrl && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('assistant.bot.memory')}
                onPress={() => bot.data?.notesUrl && openPath(bot.data.notesUrl)}
                hitSlop={6}
                className="size-8 items-center justify-center rounded-8"
              >
                <BookIcon size={17} color={palette.sub} />
              </Pressable>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('assistant.bot.newChat')}
              disabled={startNew.isPending || thinking || messages.length === 0}
              onPress={() => startNew.mutate(undefined, { onSuccess: (c) => setAsked(c.id) })}
              hitSlop={6}
              className={`size-8 items-center justify-center rounded-8 ${
                startNew.isPending || thinking || messages.length === 0 ? 'opacity-40' : ''
              }`}
            >
              <PlusIcon size={17} color={palette.sub} />
            </Pressable>
          </View>
        }
      />
      <ConversationTabs current={conversationId} onOpen={setAsked} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView ref={scroll} contentContainerClassName="px-4 pb-4">
          {bot.isError ? (
            <Text className="mt-16 text-center font-regular text-[13px] text-dim">
              {errorText(bot.error, t)}
            </Text>
          ) : bot.data && !bot.data.available ? (
            <Text className="mt-16 text-center font-regular text-[13px] text-dim">
              {t('assistant.bot.unavailable')}
            </Text>
          ) : (
            bot.data &&
            messages.length === 0 && <Welcome busy={send.isPending} onAsk={(text) => ask(text)} />
          )}
          {messages.map((m) => (
            <BotMessageView key={m.id} message={m} />
          ))}
          {thinking && (
            <View accessibilityRole="text" className="mt-3 flex-row items-center gap-2">
              <BotAvatar size={30} />
              <Text className="font-regular text-[13px] text-dim">
                {t('assistant.bot.thinking')}
              </Text>
            </View>
          )}
        </ScrollView>
        <Composer
          disabled={thinking || !bot.data?.available}
          busy={send.isPending}
          error={send.error}
          onSend={ask}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ConversationTabs({
  current,
  onOpen,
}: {
  current: number | null;
  onOpen: (id: number) => void;
}) {
  const { t } = useTranslation();
  const list = useBotConversations().data ?? [];
  const fresh = current !== null && !list.some((c) => c.id === current);
  if (list.length === 0) return null;
  const tab = (active: boolean) =>
    `h-8 max-w-[200px] justify-center rounded-8 px-3 ${active ? 'bg-control-active' : ''}`;
  const label = (active: boolean) =>
    `text-[12.5px] ${active ? 'font-medium text-text' : 'font-regular text-sub'}`;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="max-h-12 grow-0 border-b border-line"
      contentContainerClassName="items-center gap-1 px-4 py-2"
    >
      {fresh && (
        <View className={tab(true)}>
          <Text numberOfLines={1} className={label(true)}>
            {t('assistant.bot.newChat')}
          </Text>
        </View>
      )}
      {list.map((c) => (
        <Pressable
          key={c.id}
          accessibilityRole="tab"
          accessibilityState={{ selected: c.id === current }}
          onPress={() => onOpen(c.id)}
          className={tab(c.id === current)}
        >
          <Text numberOfLines={1} className={label(c.id === current)}>
            {c.title || t('assistant.bot.untitled')}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function Welcome({ busy, onAsk }: { busy: boolean; onAsk: (text: string) => void }) {
  const { t } = useTranslation();
  const examples = ['example1', 'example2', 'example3', 'example4'] as const;
  return (
    <View className="mt-8 items-center">
      <BotAvatar />
      <Text className="mt-3 font-medium text-[15px] text-text">{t('assistant.bot.welcome')}</Text>
      <Text className="mt-1 text-center font-regular text-[13px] leading-[19px] text-sub">
        {t('assistant.bot.welcomeHint')}
      </Text>
      <View className="mt-4 w-full gap-2">
        {examples.map((key) => (
          <Pressable
            key={key}
            accessibilityRole="button"
            disabled={busy}
            onPress={() => onAsk(t(`assistant.bot.${key}`))}
            className="rounded-11 border border-line bg-panel px-3 py-[10px] active:bg-control-active"
          >
            <Text className="font-regular text-[13px] text-sub">{t(`assistant.bot.${key}`)}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function BotMessageView({ message: m }: { message: BotMessage }) {
  const { t } = useTranslation();
  const resolveLink = useArticleLinks();
  if (m.role === 'action' && m.action) return <ActionCard action={m.action} />;
  if (m.role === 'user') {
    return (
      <View className="mt-3 items-end">
        <View className="max-w-[85%] rounded-14 rounded-br-[4px] bg-control-active px-3 py-2">
          <Text className="font-regular text-[14px] leading-[20px] text-text">{m.text}</Text>
        </View>
        <Text className="mt-1 font-regular text-[10.5px] text-dim">{timeOf(m.at)}</Text>
        {m.status === 'failed' && (
          <Text accessibilityRole="alert" className="mt-1 font-regular text-[12px] text-danger">
            {m.error || t('assistant.bot.failed')}
          </Text>
        )}
      </View>
    );
  }
  return (
    <View className="mt-3 flex-row gap-[10px]">
      <BotAvatar size={30} />
      <View className="min-w-0 flex-1">
        <Markdown text={m.text} size="compact" resolveLink={resolveLink} />
        {m.sources.length > 0 && <Sources sources={m.sources} />}
        <Text className="mt-1 font-regular text-[10.5px] text-dim">
          {timeOf(m.at)}
          {m.steps.length > 0 && ` · ${t('assistant.bot.steps', { count: m.steps.length })}`}
        </Text>
      </View>
    </View>
  );
}

function Sources({ sources }: { sources: BotSource[] }) {
  const { t } = useTranslation();
  const palette = themes[useTheme().theme];
  return (
    <View
      accessibilityLabel={t('assistant.bot.sources')}
      className="mt-2 flex-row flex-wrap gap-[6px]"
    >
      {sources.map((s) => {
        const Icon =
          s.kind === 'article' || s.kind === 'memory'
            ? BookIcon
            : s.kind === 'task'
              ? TasksIcon
              : ExternalIcon;
        return (
          <Pressable
            key={s.url}
            accessibilityRole="link"
            onPress={() => openPath(s.url)}
            className="max-w-[260px] flex-row items-center gap-[5px] rounded-8 border border-line px-2 py-1 active:bg-control-active"
          >
            <Icon size={13} color={palette.sub} />
            <Text numberOfLines={1} className="shrink font-regular text-[11.5px] text-sub">
              {s.title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ActionCard({ action: a }: { action: BotAction }) {
  const { t } = useTranslation();
  const decide = useDecideBotAction();
  const pending = a.status === 'pending';
  const statusColor =
    a.status === 'done' ? 'text-success' : a.status === 'failed' ? 'text-danger' : 'text-dim';
  return (
    <View
      accessibilityLabel={t(`assistant.bot.kind.${a.kind}`)}
      className={`ml-[40px] mt-3 rounded-14 border bg-panel px-4 py-3 ${
        pending ? 'border-info' : 'border-line'
      }`}
    >
      <Text className="font-semibold text-[10.5px] uppercase tracking-[1px] text-dim">
        {t(`assistant.bot.kind.${a.kind}`)}
      </Text>
      <Text className="mt-1 font-medium text-[14px] text-text">{a.preview.title}</Text>
      <View className="mt-2 gap-1">
        {a.preview.fields.map((f) => (
          <View key={f.key} className="flex-row gap-3">
            <Text className="w-[92px] font-regular text-[12.5px] text-dim">
              {t(`assistant.bot.field.${f.key}`, { defaultValue: f.key })}
            </Text>
            <Text className="flex-1 font-regular text-[12.5px] text-sub">{f.value}</Text>
          </View>
        ))}
      </View>
      {a.preview.warnings.map((w) => (
        <Text key={w} className="mt-2 font-regular text-[12px] text-warning-text">
          {w}
        </Text>
      ))}
      {pending ? (
        <View className="mt-3 flex-row gap-2">
          <Pressable
            accessibilityRole="button"
            disabled={decide.isPending}
            onPress={() => decide.mutate({ id: a.id, decision: 'confirm' })}
            className={`h-10 flex-1 items-center justify-center rounded-9 bg-brand-red ${
              decide.isPending ? 'opacity-50' : ''
            }`}
          >
            <Text className="font-semibold text-[13.5px] text-[#FFFFFF]">
              {t(a.kind === 'message' ? 'assistant.bot.send' : 'assistant.bot.confirm')}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={decide.isPending}
            onPress={() => decide.mutate({ id: a.id, decision: 'cancel' })}
            className="h-10 flex-1 items-center justify-center rounded-9 border border-line"
          >
            <Text className="font-medium text-[13.5px] text-sub">{t('assistant.cancel')}</Text>
          </Pressable>
        </View>
      ) : (
        <View className="mt-3 flex-row flex-wrap items-center gap-x-2">
          <Text accessibilityRole="text" className={`font-regular text-[12.5px] ${statusColor}`}>
            {t(`assistant.bot.status.${a.status}`)}
            {a.status === 'failed' && a.error ? `: ${a.error}` : ''}
          </Text>
          {a.status === 'done' && a.result.taskId && (
            <ResultLink label={a.result.code ?? ''} url={`/tasks?task=${a.result.taskId}`} />
          )}
          {a.status === 'done' && a.result.chatId && (
            <ResultLink label={t('assistant.bot.openChat')} url={`/chat?c=${a.result.chatId}`} />
          )}
          {a.status === 'done' && a.result.eventId && a.result.date && (
            <ResultLink
              label={t('assistant.bot.openCalendar')}
              url={`/calendar?d=${a.result.date}`}
            />
          )}
          {a.status === 'done' && a.result.googleLink && (
            <ResultLink label="Google Calendar" url={a.result.googleLink} />
          )}
        </View>
      )}
      {a.status === 'done' && a.result.googleError && (
        <Text className="mt-1 font-regular text-[12px] text-warning-text">
          {t('assistant.bot.googleFailed', { error: a.result.googleError })}
        </Text>
      )}
    </View>
  );
}

function ResultLink({ label, url }: { label: string; url: string }) {
  return (
    <Text
      accessibilityRole="link"
      onPress={() => openPath(url)}
      className="text-[12.5px] text-info"
    >
      · {label}
    </Text>
  );
}

function Composer({
  disabled,
  busy,
  error,
  onSend,
}: {
  disabled: boolean;
  busy: boolean;
  error: Error | null;
  onSend: (text: string, onDone: () => void) => void;
}) {
  const { t } = useTranslation();
  const palette = themes[useTheme().theme];
  const [text, setText] = useState('');
  const ready = text.trim().length > 0 && !disabled && !busy;
  const submit = () => {
    if (!ready) return;
    onSend(text.trim(), () => setText(''));
  };
  return (
    <View className="border-t border-line bg-panel px-4 pb-3 pt-[10px]">
      <View className="min-h-11 flex-row items-end gap-1 rounded-11 border border-line bg-surface pl-[13px] pr-[6px]">
        <TextInput
          multiline
          value={text}
          onChangeText={setText}
          maxLength={4000}
          placeholder={t('assistant.bot.placeholder')}
          placeholderTextColor={palette.dim}
          accessibilityLabel={t('assistant.bot.placeholder')}
          className="max-h-32 min-h-11 flex-1 py-3 font-regular text-[14px] text-text"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('chat.send')}
          accessibilityState={{ disabled: !ready }}
          disabled={!ready}
          onPress={submit}
          hitSlop={6}
          className={`mb-[6px] size-8 items-center justify-center rounded-6 ${ready ? '' : 'opacity-40'}`}
        >
          <SendIcon size={17} color={palette.info} />
        </Pressable>
      </View>
      {error ? (
        <Text accessibilityRole="alert" className="mt-[6px] font-regular text-[11px] text-danger">
          {errorText(error, t)}
        </Text>
      ) : (
        <Text className="mt-[6px] font-regular text-[11px] text-dim">
          {t('assistant.bot.hint')}
        </Text>
      )}
    </View>
  );
}
