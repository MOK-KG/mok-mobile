import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { useCurrentPersonId } from '@/features/auth';
import { Avatar, usePalette } from '@/features/tasks/parts';
import { CheckTinyIcon } from '@/shared/ui/icons';
import { useChatMembers } from './api';

export function MemberChecklist({
  selected,
  onToggle,
  exclude = [],
}: {
  selected: Set<string>;
  onToggle: (id: string) => void;
  exclude?: string[];
}) {
  const { t } = useTranslation();
  const palette = usePalette();
  const members = useChatMembers();
  const me = useCurrentPersonId();
  const people = Object.values(members)
    .filter((m) => m.id !== me && m.active !== false && !exclude.includes(m.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'));

  return (
    <View className="gap-1">
      {people.map((m) => {
        const on = selected.has(m.id);
        return (
          <Pressable
            key={m.id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            accessibilityLabel={m.name}
            onPress={() => onToggle(m.id)}
            className="h-[52px] flex-row items-center gap-3 rounded-9 px-2 active:bg-control-active"
          >
            <Avatar person={m} size={34} />
            <View className="min-w-0 flex-1">
              <Text numberOfLines={1} className="font-medium text-[14px] text-text">
                {m.name}
              </Text>
              <Text numberOfLines={1} className="font-regular text-[11.5px] text-dim">
                {t(`access.roles.${m.role}`)}
                {m.department ? ` · ${m.department}` : ''}
              </Text>
            </View>
            <View
              className={`size-5 items-center justify-center rounded-[5px] border ${
                on ? 'border-info bg-info' : 'border-line'
              }`}
            >
              {on && <CheckTinyIcon size={12} color={palette.canvas} />}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export const groupTitleOk = (title: string) => {
  const n = title.trim().split(/\s+/).filter(Boolean).join(' ').length;
  return n >= 2 && n <= 80;
};
