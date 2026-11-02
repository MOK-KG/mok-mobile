import { useLocalSearchParams } from 'expo-router';
import { RequirePermission } from '@/features/auth';
import { ConversationScreen } from '@/features/chat/ConversationScreen';

/** Переписка по ссылке /chat/ID — из списка чатов и из уведомлений */
export default function ConversationRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <RequirePermission permission="chat.use">
      <ConversationScreen chatId={id} />
    </RequirePermission>
  );
}
