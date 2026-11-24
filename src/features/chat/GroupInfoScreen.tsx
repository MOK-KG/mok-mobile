import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrentPersonId } from '@/features/auth';
import { Avatar, usePalette } from '@/features/tasks/parts';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import {
  useAddGroupMembers,
  useChatMembers,
  useChats,
  useRemoveGroupMember,
  useUpdateGroup,
} from './api';
import { groupTitleOk, MemberChecklist } from './MemberChecklist';
import type { ChatSummary } from './types';

const caps = 'font-semibold text-[10px] uppercase tracking-[1.4px] text-dim';
const field =
  'rounded-9 border border-line bg-surface px-3 py-[10px] font-regular text-[14px] text-text';

export function GroupInfoScreen({ chatId }: { chatId: string }) {
  const { t } = useTranslation();
  const chats = useChats();
  const chat = chats.data?.find((c) => c.id === chatId);
  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-canvas">
      <ScreenHeader title={t('chat.groupInfo')} fallback={`/chat/${chatId}`} />
      {chat && chat.kind === 'group' ? (
        <Info key={chat.id} chat={chat} />
      ) : (
        <Text className="p-6 font-regular text-[13px] text-dim">
          {chats.isPending ? '' : t('chat.groupNotFound')}
        </Text>
      )}
    </SafeAreaView>
  );
}

function Info({ chat }: { chat: ChatSummary }) {
  const { t } = useTranslation();
  const palette = usePalette();
  const me = useCurrentPersonId() ?? '';
  const members = useChatMembers();
  const update = useUpdateGroup();
  const add = useAddGroupMembers();
  const remove = useRemoveGroupMember();
  const [title, setTitle] = useState(chat.title);
  const [description, setDescription] = useState(chat.description ?? '');
  const [adding, setAdding] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const isCreator = chat.createdById === me;
  const creator = chat.createdById ? members[chat.createdById] : null;
  const changed =
    title.trim() !== chat.title || description.trim() !== (chat.description ?? '').trim();

  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const leave = () =>
    Alert.alert(t('chat.groupLeave'), t('chat.groupLeaveConfirm', { title: chat.title }), [
      { text: t('chat.close'), style: 'cancel' },
      {
        text: t('chat.groupLeave'),
        style: 'destructive',
        onPress: () =>
          remove
            .mutateAsync({ chatId: chat.id, memberId: me })
            .then(() => router.replace('/chat'))
            .catch(() => null),
      },
    ]);

  const removeMember = (id: string, name: string) =>
    Alert.alert(t('chat.groupRemove'), name, [
      { text: t('chat.close'), style: 'cancel' },
      {
        text: t('chat.groupRemove'),
        style: 'destructive',
        onPress: () => remove.mutate({ chatId: chat.id, memberId: id }),
      },
    ]);

  return (
    <ScrollView contentContainerClassName="gap-4 px-4 pb-8 pt-2">
      {isCreator ? (
        <View className="gap-3">
          <View className="gap-[6px]">
            <Text className={caps}>{t('chat.groupTitle')}</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              accessibilityLabel={t('chat.groupTitle')}
              placeholderTextColor={palette.dim}
              className={`${field} ${groupTitleOk(title) ? '' : 'border-danger'}`}
            />
          </View>
          <View className="gap-[6px]">
            <Text className={caps}>{t('chat.groupDescription')}</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              multiline
              accessibilityLabel={t('chat.groupDescription')}
              placeholder={t('chat.groupDescriptionPlaceholder')}
              placeholderTextColor={palette.dim}
              className={`${field} min-h-[72px]`}
            />
          </View>
          {changed && groupTitleOk(title) && (
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                update.mutate({
                  chatId: chat.id,
                  title: title.trim(),
                  description: description.trim(),
                })
              }
              className="h-10 items-center justify-center rounded-9 bg-brand-red"
            >
              <Text className="font-semibold text-[13.5px] text-[#FFFFFF]">
                {t('chat.groupSave')}
              </Text>
            </Pressable>
          )}
        </View>
      ) : (
        <View className="gap-1">
          <Text className="font-semibold text-[17px] tracking-[-0.3px] text-text">
            {chat.title}
          </Text>
          <Text className="font-regular text-[13px] leading-[19px] text-sub">
            {chat.description || t('chat.groupNoDescription')}
          </Text>
        </View>
      )}
      {creator && (
        <Text className="font-regular text-[12px] text-faint">
          {t('chat.groupCreatedBy', { name: creator.name })}
        </Text>
      )}

      <View className="gap-1">
        <Text className={caps}>
          {t('chat.groupMembers')} · {chat.memberIds.length}
        </Text>
        {chat.memberIds.map((id) => {
          const m = members[id];
          if (!m) return null;
          return (
            <View key={id} className="h-[52px] flex-row items-center gap-3 px-2">
              <Avatar person={m} size={34} />
              <View className="min-w-0 flex-1">
                <Text numberOfLines={1} className="font-medium text-[14px] text-text">
                  {m.name}
                  {id === me ? ` · ${t('chat.you')}` : ''}
                </Text>
                <Text numberOfLines={1} className="font-regular text-[11.5px] text-dim">
                  {id === chat.createdById ? t('chat.creator') : t(`access.roles.${m.role}`)}
                </Text>
              </View>
              {isCreator && id !== me && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${t('chat.groupRemove')}: ${m.name}`}
                  onPress={() => removeMember(id, m.name)}
                  hitSlop={6}
                  className="h-8 justify-center rounded-8 border border-line px-3"
                >
                  <Text className="font-medium text-[11.5px] text-sub">
                    {t('chat.groupRemove')}
                  </Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </View>

      {adding ? (
        <View className="gap-2">
          <MemberChecklist selected={picked} onToggle={toggle} exclude={chat.memberIds} />
          <Pressable
            accessibilityRole="button"
            disabled={picked.size === 0 || add.isPending}
            onPress={() =>
              add
                .mutateAsync({ chatId: chat.id, memberIds: [...picked] })
                .then(() => {
                  setPicked(new Set());
                  setAdding(false);
                })
                .catch(() => null)
            }
            className={`h-10 items-center justify-center rounded-9 bg-brand-red ${
              picked.size === 0 ? 'opacity-50' : ''
            }`}
          >
            <Text className="font-semibold text-[13.5px] text-[#FFFFFF]">
              {t('chat.groupAdd')} · {picked.size}
            </Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => setAdding(true)}
          className="h-10 items-center justify-center rounded-9 border border-line"
        >
          <Text className="font-medium text-[13.5px] text-sub">{t('chat.groupAdd')}</Text>
        </Pressable>
      )}

      <Pressable
        accessibilityRole="button"
        onPress={leave}
        className="h-10 items-center justify-center rounded-9 border border-danger-line"
      >
        <Text className="font-medium text-[13.5px] text-danger">{t('chat.groupLeave')}</Text>
      </Pressable>
    </ScrollView>
  );
}
