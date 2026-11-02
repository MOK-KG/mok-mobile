import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/app/providers/ThemeProvider';
import { themes } from '@/shared/config/tokens';
import { PlusIcon, SearchIcon, XIcon } from '@/shared/ui/icons';
import { Tooltip } from '@/shared/ui/Tooltip';
import { useChats, useStartDirect } from './api';
import { NewChatSheet } from './NewChatSheet';
import { ChatBadge, listTime, peerSubtitle, previewOf } from './parts';
import type { ChatSummary } from './types';

/** Раздел «Чат» на мобильном: каналы департаментов и личные переписки (макет: «Мобильный чат») */
export function ChatListScreen() {
  const { t, i18n } = useTranslation();
  const palette = themes[useTheme().theme];
  const chats = useChats();
  const start = useStartDirect();
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const sheet = useRef<BottomSheetModal>(null);

  const visible = useMemo(() => {
    const q = search.trim().toLocaleLowerCase(i18n.language);
    const all = chats.data ?? [];
    if (!q) return all;
    return all.filter((c) =>
      [c.title, c.fullTitle].some((s) => s.toLocaleLowerCase(i18n.language).includes(q)),
    );
  }, [chats.data, search, i18n.language]);

  const openPeer = async (memberId: string) => {
    const chatId = await start.mutateAsync(memberId);
    router.push(`/chat/${chatId}`);
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <View className="h-[52px] flex-row items-center gap-2 border-b border-line bg-panel px-4">
        {searching ? (
          <TextInput
            autoFocus
            value={search}
            onChangeText={setSearch}
            placeholder={t('chat.search')}
            placeholderTextColor={palette.dim}
            accessibilityLabel={t('chat.search')}
            className="h-9 flex-1 rounded-8 bg-surface px-3 font-regular text-[14px] text-text"
          />
        ) : (
          <Text
            accessibilityRole="header"
            className="flex-1 font-semibold text-[17px] tracking-[-0.3px] text-text"
          >
            {t('chat.title')}
          </Text>
        )}
        <Tooltip content={searching ? t('chat.close') : t('chat.search')}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={searching ? t('chat.close') : t('chat.search')}
            onPress={() => {
              if (searching) setSearch('');
              setSearching((s) => !s);
            }}
            hitSlop={8}
            className="size-7 items-center justify-center rounded-[7px]"
          >
            {searching ? (
              <XIcon size={16} color={palette.sub} />
            ) : (
              <SearchIcon size={16} color={palette.sub} />
            )}
          </Pressable>
        </Tooltip>
        <Tooltip content={t('chat.newChat')}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('chat.newChat')}
            onPress={() => sheet.current?.present()}
            className="size-7 items-center justify-center rounded-8 bg-brand-red active:opacity-80"
          >
            <PlusIcon size={16} color="#FFFFFF" />
          </Pressable>
        </Tooltip>
      </View>

      <FlashList
        data={visible}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <ChatRow chat={item} onPress={() => router.push(`/chat/${item.id}`)} />
        )}
        ListEmptyComponent={
          chats.isPending ? null : (
            <Text className="py-10 text-center font-regular text-[13px] text-dim">
              {t('chat.nothingFound')}
            </Text>
          )
        }
      />

      <NewChatSheet sheetRef={sheet} onPick={openPeer} />
    </SafeAreaView>
  );
}

function ChatRow({ chat, onPress }: { chat: ChatSummary; onPress: () => void }) {
  const { t, i18n } = useTranslation();
  const subtitle =
    chat.kind === 'channel'
      ? t('chat.members', { count: chat.memberIds.length })
      : peerSubtitle(chat.peerId, t, i18n.language);
  const preview = previewOf(chat, chat.last, t);
  const time = chat.last ? listTime(chat.last.at, t, i18n.language) : '';
  const unread = chat.unread > 0 ? `, ${t('chat.unread', { count: chat.unread })}` : '';

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${chat.title}, ${subtitle}, ${preview}${unread}`}
      onPress={onPress}
      className="h-[72px] flex-row items-center gap-3 border-b border-line bg-panel px-4 active:bg-row-highlight"
    >
      <ChatBadge chat={chat} />
      <View className="min-w-0 flex-1">
        <View className="flex-row items-center gap-2">
          <Text
            numberOfLines={1}
            className="flex-1 font-medium text-[15px] tracking-[-0.2px] text-text"
          >
            {chat.title}
          </Text>
          <Text className="font-regular text-[11px] text-dim">{time}</Text>
        </View>
        <Text numberOfLines={1} className="font-regular text-[11px] text-dim">
          {subtitle}
          {chat.muted ? ` · ${t('chat.muted')}` : ''}
        </Text>
        <View className="flex-row items-center gap-2">
          <Text numberOfLines={1} className="flex-1 font-regular text-[13px] text-sub">
            {preview}
          </Text>
          {chat.unread > 0 && (
            <View
              className={`h-[18px] min-w-[18px] items-center justify-center rounded-full px-[5px] ${
                chat.muted ? 'bg-chip' : 'bg-brand-red'
              }`}
            >
              <Text
                className={`font-semibold text-[10.5px] ${chat.muted ? 'text-chip-text' : 'text-[#FFFFFF]'}`}
              >
                {chat.unread}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}
