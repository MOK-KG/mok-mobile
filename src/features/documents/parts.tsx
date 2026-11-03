import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import type { DocStatus } from './types';

const statusTone: Record<DocStatus, string> = {
  draft: 'bg-muted-chip text-dim',
  registered: 'bg-warning-chip text-warning-text',
  inWork: 'bg-info-chip text-info-text',
  done: 'bg-success-chip text-success',
  sent: 'bg-success-chip text-success',
  signed: 'bg-success-chip text-success',
  annulled: 'bg-danger-chip text-danger',
};

export function StatusChip({ status }: { status: DocStatus }) {
  const { t } = useTranslation();
  return (
    <Text
      className={`self-start overflow-hidden rounded-[5px] px-[7px] py-[3px] font-medium text-[10.5px] ${statusTone[status]}`}
    >
      {t(`documents.status.${status}`)}
    </Text>
  );
}
