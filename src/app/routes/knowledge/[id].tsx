import { useLocalSearchParams } from 'expo-router';
import { RequirePermission } from '@/features/auth';
import { ArticleScreen } from '@/features/knowledge-base/ArticleScreen';

/** Статья по ссылке /knowledge/ID; статья закрытого раздела — 403 */
export default function ArticleRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <RequirePermission permission="knowledge.view">
      <ArticleScreen articleId={id} />
    </RequirePermission>
  );
}
