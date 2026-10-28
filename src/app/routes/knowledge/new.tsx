import { useLocalSearchParams } from 'expo-router';
import { RequirePermission } from '@/features/auth';
import { ArticleEditorScreen } from '@/features/knowledge-base/ArticleEditorScreen';

/** Новая статья; ?section=ID — раздел по умолчанию. Без права knowledge.edit — 403 */
export default function NewArticleRoute() {
  const { section } = useLocalSearchParams<{ section?: string }>();
  return (
    <RequirePermission permission="knowledge.edit">
      <ArticleEditorScreen sectionId={section} />
    </RequirePermission>
  );
}
