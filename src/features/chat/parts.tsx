import type { TFunction } from 'i18next';
import { Text, View } from 'react-native';
import { absenceOf, isAbsentOn } from '@/features/tasks/absences';
import { Avatar } from '@/features/tasks/parts';
import { formatInBishkek, formatIsoDate } from '@/shared/lib/date';
import { addDays, type IsoDate, todayInBishkek } from '@/shared/lib/workDays';
import { chatMembers, currentMemberId } from './api';
import type { Chat, ChatMessage } from './types';

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
export function peerSubtitle(peerId: string | null, t: TFunction, lang: string, long = false) {
  const peer = peerId ? chatMembers[peerId] : undefined;
  if (!peer) return '';
  const today = todayInBishkek();
  const absence = absenceOf(peer.id, today);
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
export function previewOf(chat: Chat, message: ChatMessage | null, t: TFunction) {
  if (!message) return t('chat.noMessages');
  if (message.kind === 'system') {
    return message.system?.kind === 'autoreply'
      ? t('chat.autoreplyShort', { deputy: message.text })
      : (message.system?.title ?? message.text);
  }
  const body =
    message.kind === 'task'
      ? `${t('chat.taskFromBoard')}: ${message.task?.title ?? ''}`
      : message.text || message.file?.name || '';
  if (message.authorId === currentMemberId) return `${t('chat.you')}: ${body}`;
  if (chat.kind === 'channel' && message.authorId) {
    const first = chatMembers[message.authorId]?.name.split(' ')[0];
    if (first) return `${first}: ${body}`;
  }
  return body;
}

/** Значок переписки: «#» у канала, инициалы собеседника у личной */
export function ChatBadge({ chat, size = 40 }: { chat: Chat; size?: number }) {
  const peer = chat.peerId ? chatMembers[chat.peerId] : undefined;
  if (chat.kind === 'direct' && peer) return <Avatar person={peer} size={size} />;
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
