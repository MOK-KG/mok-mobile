import { useLocalSearchParams } from 'expo-router';
import { SectionScreen } from '@/features/sections/SectionScreen';
import { type Section, sections } from '@/shared/config/permissions';

const isSection = (value: unknown): value is Section =>
  typeof value === 'string' && value in sections;

/** Разделы из вкладки «Ещё» без своего экрана (роли) — поверх вкладок; календарь, файлы и база знаний — свои маршруты */
export default function SectionRoute() {
  const { section } = useLocalSearchParams<{ section: string }>();
  if (!isSection(section)) return null;
  return <SectionScreen section={section} />;
}
