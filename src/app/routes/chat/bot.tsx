import { BotScreen } from '@/features/assistant/BotScreen';
import { RequirePermission } from '@/features/auth';

export default function BotRoute() {
  return (
    <RequirePermission permission="chat.use">
      <BotScreen />
    </RequirePermission>
  );
}
