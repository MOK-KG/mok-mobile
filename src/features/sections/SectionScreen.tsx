import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RequirePermission } from '@/features/auth';
import { type Section, sections } from '@/shared/config/permissions';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import { TabHeader } from '@/shared/ui/TabHeader';

/**
 * Раздел, которого ещё нет по макетам. Во вкладке — шапка без «назад»,
 * открытый из «Ещё» — с «назад». Без права — 403.
 */
export function SectionScreen({ section, tab = false }: { section: Section; tab?: boolean }) {
  const { t } = useTranslation();
  const title = t(`sections.${section}`);
  return (
    <RequirePermission permission={sections[section]}>
      <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
        {tab ? <TabHeader title={title} /> : <ScreenHeader title={title} fallback="/more" />}
        <View className="m-4 rounded-18 bg-card p-6">
          <Text className="font-regular text-[14px] text-sub">{t('sections.placeholder')}</Text>
        </View>
      </SafeAreaView>
    </RequirePermission>
  );
}
