import { RequirePermission } from '@/features/auth';
import { KnowledgeScreen } from '@/features/knowledge-base/KnowledgeScreen';

/** База знаний — из вкладки «Ещё»; без права — 403 */
export default function KnowledgeRoute() {
  return (
    <RequirePermission permission="knowledge.view">
      <KnowledgeScreen />
    </RequirePermission>
  );
}
