import { Link, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RequirePermission } from '@/features/auth';
import { type Section, sections } from '@/shared/config/permissions';

const isSection = (value: unknown): value is Section =>
  typeof value === 'string' && value in sections;

/** Временный экран раздела: сами разделы появятся по макетам. Без права — 403 */
export default function SectionScreen() {
  const { t } = useTranslation();
  const { section } = useLocalSearchParams<{ section: string }>();
  if (!isSection(section)) return null;

  return (
    <RequirePermission permission={sections[section]}>
      <SafeAreaView className="flex-1 gap-4 bg-canvas p-4">
        <Link href="/" className="font-medium text-[13px] text-info">
          ← {t('sections.home')}
        </Link>
        <View className="rounded-18 bg-card p-6">
          <Text className="font-bold text-[24px] text-text">{t(`sections.${section}`)}</Text>
          <Text className="mt-2 font-regular text-sub">{t('sections.placeholder')}</Text>
        </View>
      </SafeAreaView>
    </RequirePermission>
  );
}
