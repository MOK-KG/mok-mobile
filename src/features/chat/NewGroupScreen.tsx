import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePalette } from '@/features/tasks/parts';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import { useCreateGroup } from './api';
import { groupTitleOk, MemberChecklist } from './MemberChecklist';

const caps = 'font-semibold text-[10px] uppercase tracking-[1.4px] text-dim';
const field =
  'rounded-9 border border-line bg-surface px-3 py-[10px] font-regular text-[14px] text-text';

export function NewGroupScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const create = useCreateGroup();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tried, setTried] = useState(false);
  const titleError = tried && !groupTitleOk(title);
  const membersError = tried && selected.size === 0;

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const submit = () => {
    setTried(true);
    if (!groupTitleOk(title) || selected.size === 0) return;
    create
      .mutateAsync({
        title: title.trim(),
        description: description.trim(),
        memberIds: [...selected],
      })
      .then((id) => router.replace(`/chat/${id}`))
      .catch(() => null);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-canvas">
      <ScreenHeader title={t('chat.newGroup')} fallback="/chat" />
      <ScrollView contentContainerClassName="gap-4 px-4 pb-6 pt-2">
        <Text className="font-regular text-[12.5px] leading-[18px] text-faint">
          {t('chat.newGroupHint')}
        </Text>
        <View className="gap-[6px]">
          <Text className={caps}>{t('chat.groupTitle')}</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            accessibilityLabel={t('chat.groupTitle')}
            placeholder={t('chat.groupTitlePlaceholder')}
            placeholderTextColor={palette.dim}
            className={`${field} ${titleError ? 'border-danger' : ''}`}
          />
          {titleError && (
            <Text className="font-regular text-[11.5px] text-danger">
              {t('chat.groupTitleError')}
            </Text>
          )}
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
        <View className="gap-[6px]">
          <View className="flex-row items-center justify-between">
            <Text className={caps}>{t('chat.groupMembers')}</Text>
            <Text className="font-regular text-[11.5px] text-dim">
              {t('chat.groupMembersPicked', { count: selected.size })}
            </Text>
          </View>
          {membersError && (
            <Text className="font-regular text-[11.5px] text-danger">
              {t('chat.groupMembersError')}
            </Text>
          )}
          <MemberChecklist selected={selected} onToggle={toggle} />
        </View>
      </ScrollView>
      <View className="border-t border-line bg-panel px-4 py-3">
        <Pressable
          accessibilityRole="button"
          disabled={create.isPending}
          onPress={submit}
          className={`h-11 items-center justify-center rounded-9 bg-brand-red ${create.isPending ? 'opacity-60' : ''}`}
        >
          <Text className="font-semibold text-[14px] text-[#FFFFFF]">{t('chat.groupCreate')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
