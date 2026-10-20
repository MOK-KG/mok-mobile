import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { relativeShort } from '@/shared/lib/date';
import { AlertMiniIcon, CheckMiniIcon, MailLetterIcon, PaperclipIcon } from '@/shared/ui/icons';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import { useMailQueue } from '../api';
import { canCreate, type Letter } from '../mailQueue';
import { sectionTitle, usePalette } from '../parts';

/** Очередь из почты: письма, разобранные моделью, и письма для ручного оформления */
export function QueueScreen() {
  const { t } = useTranslation();
  const queue = useMailQueue();
  const letters = queue.data ?? [];
  const ready = letters.filter((l) => l.suggestion);
  const manual = letters.filter((l) => !l.suggestion);

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-canvas">
      <ScreenHeader fallback="/tasks" title={t('mailQueue.title')} />
      <Text className="border-b border-line bg-column px-4 py-2 font-regular text-[12px] text-faint">
        {t('mailQueue.subtitle', {
          mailbox: 'info@olympic.kg',
          ready: ready.length,
          manual: manual.length,
        })}
      </Text>
      {letters.length === 0 && !queue.isPending ? (
        <Text className="py-10 text-center font-regular text-[13px] text-sub">
          {t('mailQueue.empty')}
        </Text>
      ) : (
        <ScrollView contentContainerClassName="pb-6">
          {ready.length > 0 && (
            <>
              <GroupTitle tone="success" count={ready.length}>
                {t('mailQueue.readyGroup')}
              </GroupTitle>
              {ready.map((l) => (
                <LetterRow
                  key={l.id}
                  letter={l}
                  onPress={() => router.push(`/tasks/letter/${l.id}`)}
                />
              ))}
            </>
          )}
          {manual.length > 0 && (
            <>
              <GroupTitle tone="danger" count={manual.length}>
                {t('mailQueue.manualGroup')}
              </GroupTitle>
              {manual.map((l) => (
                <LetterRow
                  key={l.id}
                  letter={l}
                  onPress={() => router.push(`/tasks/new?letter=${l.id}`)}
                />
              ))}
              <Text className="px-4 pt-2 font-regular text-[11px] leading-[15px] text-dim">
                {t('mailQueue.manualNote')}
              </Text>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function GroupTitle({
  tone,
  count,
  children,
}: {
  tone: 'success' | 'danger';
  count: number;
  children: ReactNode;
}) {
  return (
    <View className="flex-row items-center gap-2 px-4 pb-2 pt-4">
      <Text className={sectionTitle}>{children}</Text>
      <Text
        className={`overflow-hidden rounded-[5px] px-[6px] py-px font-semibold text-[10px] ${
          tone === 'success' ? 'bg-tone-green-bg text-success' : 'bg-danger-chip text-danger'
        }`}
      >
        {count}
      </Text>
    </View>
  );
}

export function StateChip({ ready }: { ready: boolean }) {
  const { t } = useTranslation();
  const palette = usePalette();
  return (
    <View
      className={`h-5 flex-row items-center gap-1 self-start rounded-[5px] px-[6px] ${
        ready ? 'bg-tone-green-bg' : 'bg-warning-chip'
      }`}
    >
      {ready ? (
        <CheckMiniIcon size={11} color={palette['tone-green']} />
      ) : (
        <AlertMiniIcon size={11} color={palette['warning-text']} />
      )}
      <Text
        className={`font-medium text-[10.5px] ${ready ? 'text-tone-green' : 'text-warning-text'}`}
      >
        {ready ? t('mailQueue.stateReady') : t('mailQueue.stateCheck')}
      </Text>
    </View>
  );
}

function LetterRow({ letter, onPress }: { letter: Letter; onPress: () => void }) {
  const { t } = useTranslation();
  const palette = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${letter.sender}. ${letter.subject}`}
      onPress={onPress}
      className="flex-row gap-[9px] border-b border-line bg-panel px-4 py-3 active:bg-row-highlight"
    >
      <View className="mt-[2px]">
        <MailLetterIcon size={15} color={palette.faint} />
      </View>
      <View className="min-w-0 flex-1">
        <View className="flex-row items-baseline gap-2">
          <Text numberOfLines={1} className="flex-1 font-medium text-[12px] text-sub">
            {letter.sender}
          </Text>
          <Text className="font-regular text-[10.5px] text-dim">
            {relativeShort(letter.receivedAt, t)}
          </Text>
        </View>
        <Text
          numberOfLines={2}
          className="mt-[2px] font-regular text-[13.5px] leading-[19px] text-text"
        >
          {letter.subject}
        </Text>
        <View className="mt-[7px] flex-row items-center gap-2">
          {letter.suggestion ? (
            <StateChip ready={canCreate(letter.suggestion)} />
          ) : (
            <Text className="font-medium text-[11.5px] text-info">
              {t('mailQueue.manualAction')}
            </Text>
          )}
          {letter.attachments.length > 0 && (
            <View className="ml-auto flex-row items-center gap-[3px]">
              <PaperclipIcon size={13} color={palette.dim} />
              <Text className="font-regular text-[10.5px] text-dim">
                {letter.attachments.length}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}
