import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { toneClasses } from '@/features/tasks/ui';
import type { RoleCode } from '@/shared/config/permissions';
import type { Tone } from '@/shared/config/tokens';
import { initials } from '@/shared/lib/text';
import type { StaffBadge } from './types';

/** Цвета кода роли — как на вебе */
const roleTone: Partial<Record<RoleCode, Tone>> = {
  R1: 'blue',
  R2: 'orange',
  R3: 'red',
  R4: 'green',
  R6: 'amber',
  R7: 'cyan',
  R8: 'violet',
};

export function RoleChip({ role }: { role: RoleCode }) {
  const tone = roleTone[role];
  return (
    <Text
      className={`overflow-hidden rounded-[5px] border px-[5px] py-[1px] font-semibold text-[10.5px] ${
        tone ? `${toneClasses[tone].text} border-current` : 'border-line text-sub'
      }`}
    >
      {role}
    </Text>
  );
}

const badgeTone: Record<StaffBadge, string> = {
  active: 'bg-success-chip text-success',
  vacation: 'bg-info-chip text-info',
  invited: 'bg-warning-chip text-warning-text',
  external: 'bg-chip text-chip-text',
  vacancy: 'bg-muted-chip text-dim',
  deactivated: 'bg-danger-chip text-danger',
};

export function StatusBadge({ badge }: { badge: StaffBadge }) {
  const { t } = useTranslation();
  return (
    <Text
      className={`overflow-hidden rounded-6 px-[7px] py-[2px] font-medium text-[10.5px] ${badgeTone[badge]}`}
    >
      {t(`access.status.${badge}`)}
    </Text>
  );
}

/** Аватар с инициалами; у вакансии — пунктирный круг с «?» */
export function StaffAvatar({
  name,
  tone,
  size,
}: {
  name: string | null;
  tone: Tone;
  size: number;
}) {
  const cls = toneClasses[tone];
  return (
    <View
      style={{ width: size, height: size }}
      className={`items-center justify-center rounded-full ${
        name ? cls.bg : 'border border-dashed border-line'
      }`}
    >
      <Text
        style={{ fontSize: size * 0.34 }}
        className={`font-semibold ${name ? cls.text : 'text-dim'}`}
      >
        {name ? initials(name) : '?'}
      </Text>
    </View>
  );
}
