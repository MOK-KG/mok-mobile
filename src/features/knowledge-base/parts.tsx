import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { useTheme } from '@/app/providers/ThemeProvider';
import type { Person } from '@/features/tasks/types';
import { toneClasses } from '@/features/tasks/ui';
import { themes } from '@/shared/config/tokens';
import { formatIsoDate } from '@/shared/lib/date';
import { initials } from '@/shared/lib/text';
import { type IsoDate, todayInBishkek } from '@/shared/lib/workDays';
import { CheckBadgeIcon } from '@/shared/ui/icons';
import type { KbFreshness } from './types';

/** «3 сентября» в текущем году, «3 сентября 2025» — в другом (как в web) */
export function useShortDate() {
  const { i18n } = useTranslation();
  const year = todayInBishkek().slice(0, 4);
  return (date: IsoDate) =>
    formatIsoDate(date, date.startsWith(year) ? 'd MMMM' : 'd MMMM yyyy', i18n.language);
}

export function Avatar({ person, size }: { person: Person; size: 20 | 24 }) {
  const tone = toneClasses[person.tone];
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className={`items-center justify-center rounded-full ${tone.bg} ${size === 20 ? 'size-5' : 'size-6'}`}
    >
      <Text
        className={`font-semibold ${tone.text} ${size === 20 ? 'text-[8.5px]' : 'text-[9.5px]'}`}
      >
        {initials(person.name)}
      </Text>
    </View>
  );
}

/** Метка «Актуально» / «Давно не обновляли»; в статье — крупнее и с галочкой */
export function FreshnessBadge({
  freshness,
  large = false,
}: {
  freshness: KbFreshness;
  large?: boolean;
}) {
  const { t } = useTranslation();
  const palette = themes[useTheme().theme];
  if (!freshness) return null;
  const fresh = freshness === 'fresh';
  return (
    <View
      className={`flex-row items-center self-start ${fresh ? 'bg-success-chip' : 'bg-warning-chip'} ${
        large ? 'h-[22px] gap-1 rounded-6 px-2' : 'h-5 rounded-[5px] px-[7px]'
      }`}
    >
      {large && fresh && <CheckBadgeIcon size={12} color={palette.success} />}
      <Text
        className={`font-medium ${fresh ? 'text-success' : 'text-warning-text'} ${
          large ? 'text-[10.5px]' : 'text-[10px]'
        }`}
      >
        {t(`knowledge.${freshness}`)}
      </Text>
    </View>
  );
}

/** Подпись блока: «СОДЕРЖАНИЕ», «ИСТОРИЯ ВЕРСИЙ» */
export const capsTitle = 'font-semibold text-[10px] uppercase tracking-[1.4px] text-dim';
