import { RequirePermission } from '@/features/auth';
import { GraphScreen } from '@/features/knowledge-base/graph/GraphScreen';

export default function KnowledgeGraphRoute() {
  return (
    <RequirePermission permission="knowledge.view">
      <GraphScreen />
    </RequirePermission>
  );
}
