import { useLocalSearchParams } from 'expo-router';
import { RequirePermission } from '@/features/auth';
import { ArticleEditorScreen } from '@/features/knowledge-base/ArticleEditorScreen';

/** Правка статьи /knowledge/ID/edit; без права knowledge.edit или в закрытом разделе — 403 */
export default function EditArticleRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <RequirePermission permission="knowledge.edit">
      <ArticleEditorScreen articleId={id} />
    </RequirePermission>
  );
}
