import { useLocalSearchParams } from 'expo-router';
import { RequirePermission } from '@/features/auth';
import { LetterScreen } from '@/features/tasks/queue/LetterScreen';

export default function LetterRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <RequirePermission permission="tasks.create">
      <LetterScreen letterId={id} />
    </RequirePermission>
  );
}
