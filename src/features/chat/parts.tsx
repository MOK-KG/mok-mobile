import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Linking, Text, View } from 'react-native';
import { type Absence, absenceOf, isAbsentOn } from '@/features/tasks/absences';
import { Avatar, usePalette } from '@/features/tasks/parts';
import { formatInBishkek, formatIsoDate } from '@/shared/lib/date';
import { addDays, type IsoDate, todayInBishkek } from '@/shared/lib/workDays';
import { GroupIcon } from '@/shared/ui/icons';
import { useChatMembers } from './api';
import { messageParts } from './mentions';
import type { Chat, ChatMember, ChatMessage } from './types';

/** Общие куски чата на мобильном: список переписок и сама переписка */

/** День сообщения по Бишкеку (UTC+6), а не по поясу телефона */
export const dayOf = (iso: string): IsoDate => formatInBishkek(iso, 'yyyy-MM-dd');

/** Время в списке: сегодня — «14:02», вчера — «вчера», раньше — «8 сент» */
export function listTime(iso: string, t: TFunction, lang: string, today = todayInBishkek()) {
  const day = dayOf(iso);
  if (day === today) return formatInBishkek(iso, 'HH:mm', lang);
  if (day === addDays(today, -1)) return t('time.yesterday');
  return formatInBishkek(iso, 'd MMM', lang).replace('.', '');
}

/** Разделитель дней в переписке: «Сегодня», «Вчера», иначе дата */
export function dayLabel(day: IsoDate, t: TFunction, lang: string, today = todayInBishkek()) {
  if (day === today) return t('chat.today');
  if (day === addDays(today, -1)) return t('chat.yesterday');
  const pattern = day.slice(0, 4) === today.slice(0, 4) ? 'd MMMM' : 'd MMMM yyyy';
  return formatIsoDate(day, pattern, lang);
}

/** Подпись собеседника: «R5 · Медицинский» или «R4 · в отпуске» */
export function peerSubtitle(
  peer: ChatMember | undefined,
  t: TFunction,
  lang: string,
  long = false,
  absences?: Absence[],
) {
  if (!peer) return '';
  const today = todayInBishkek();
  const absence = absenceOf(peer.id, today, absences);
  if (absence && isAbsentOn(absence, today)) {
    const vacation = long
      ? t('chat.vacationUntil', { date: formatIsoDate(absence.to, 'd MMM', lang).replace('.', '') })
      : t('chat.onVacation');
    return `${peer.role} · ${vacation}`;
  }
  // У аппарата — название роли («R1 · Администратор»), как в макете: аппарат — не департамент
  const where = peer.department === 'Аппарат' ? t(`access.roles.${peer.role}`) : peer.department;
  return `${peer.role} · ${where}`;
}

/** Текст сообщения для строки списка: «Кубат: …», «Вы: …», «Автоответ: …» */
export function previewOf(
  chat: Chat,
  message: ChatMessage | null,
  t: TFunction,
  members: Record<string, ChatMember>,
  me: string | undefined,
) {
  if (!message) return t('chat.noMessages');
  if (message.kind === 'system') {
    return message.system?.kind === 'autoreply'
      ? t('chat.autoreplyShort', { deputy: message.text })
      : (message.system?.title ?? message.text);
  }
  const body =
    message.kind === 'task'
      ? `${t('chat.taskFromBoard')}: ${message.task?.title ?? t('chat.taskHidden')}`
      : message.kind === 'article'
        ? `${t('chat.articleFromKb')}: ${message.article?.title ?? t('chat.articleHidden')}`
        : message.text || message.file?.name || '';
  if (message.authorId === me) return `${t('chat.you')}: ${body}`;
  if (chat.kind === 'channel' && message.authorId) {
    const first = members[message.authorId]?.name.split(' ')[0];
    if (first) return `${first}: ${body}`;
  }
  return body;
}

/** Значок переписки: «#» у канала, инициалы собеседника у личной */
export function ChatBadge({ chat, size = 40 }: { chat: Chat; size?: number }) {
  const { t } = useTranslation();
  const members = useChatMembers();
  const palette = usePalette();
  const peer = chat.peerId ? members[chat.peerId] : undefined;
  if (chat.kind === 'direct' && peer) {
    return (
      <View>
        <Avatar person={peer} size={size} />
        {peer.online && (
          <View
            accessibilityLabel={t('chat.online')}
            className="absolute -bottom-px -right-px size-[11px] rounded-full border-2 border-panel bg-success"
          />
        )}
      </View>
    );
  }
  if (chat.kind === 'group') {
    return (
      <View
        style={{ width: size, height: size }}
        className={`items-center justify-center bg-surface ${size > 32 ? 'rounded-11' : 'rounded-8'}`}
      >
        <GroupIcon size={size * 0.45} color={palette.faint} />
      </View>
    );
  }
  return (
    <View
      style={{ width: size, height: size }}
      className={`items-center justify-center bg-surface ${size > 32 ? 'rounded-11' : 'rounded-8'}`}
    >
      <Text style={{ fontSize: size * 0.45 }} className="font-semibold text-faint">
        #
      </Text>
    </View>
  );
}

export function MessageText({ text }: { text: string }) {
  return (
    <Text className="font-regular text-[14px] leading-[20px] text-sub">
      {messageParts(text).map((part, i) =>
        part.kind === 'mention' ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: части текста не переставляются
          <Text key={i} className="font-medium text-info">
            {part.value}
          </Text>
        ) : part.kind === 'link' ? (
          <Text
            // biome-ignore lint/suspicious/noArrayIndexKey: части текста не переставляются
            key={i}
            accessibilityRole="link"
            onPress={() => Linking.openURL(part.href)}
            className="text-info underline"
          >
            {part.value}
          </Text>
        ) : (
          part.value
        ),
      )}
    </Text>
  );
}
