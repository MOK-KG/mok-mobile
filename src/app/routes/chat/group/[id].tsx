import { useLocalSearchParams } from 'expo-router';
import { RequirePermission } from '@/features/auth';
import { GroupInfoScreen } from '@/features/chat/GroupInfoScreen';

export default function GroupInfoRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <RequirePermission permission="chat.use">
      <GroupInfoScreen chatId={id} />
    </RequirePermission>
  );
}
