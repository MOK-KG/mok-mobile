import { useLocalSearchParams } from 'expo-router';
import { RequirePermission } from '@/features/auth';
import { ThreadScreen } from '@/features/chat/ThreadScreen';

/** Ветка ответов к сообщению канала: /chat/thread/ID?chat=ID */
export default function ThreadRoute() {
  const { root, chat } = useLocalSearchParams<{ root: string; chat: string }>();
  return (
    <RequirePermission permission="chat.use">
      <ThreadScreen chatId={chat} rootId={root} />
    </RequirePermission>
  );
}
