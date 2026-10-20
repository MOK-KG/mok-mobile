import { useLocalSearchParams } from 'expo-router';
import { SectionScreen } from '@/features/sections/SectionScreen';
import { type Section, sections } from '@/shared/config/permissions';

const isSection = (value: unknown): value is Section =>
  typeof value === 'string' && value in sections;

/** Разделы из вкладки «Ещё» (календарь, база знаний, файлы, роли) — поверх вкладок */
export default function SectionRoute() {
  const { section } = useLocalSearchParams<{ section: string }>();
  if (!isSection(section)) return null;
  return <SectionScreen section={section} />;
}
