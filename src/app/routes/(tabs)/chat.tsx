import { RequirePermission } from '@/features/auth';
import { ChatListScreen } from '@/features/chat/ChatListScreen';

export default function ChatRoute() {
  return (
    <RequirePermission permission="chat.use">
      <ChatListScreen />
    </RequirePermission>
  );
}
