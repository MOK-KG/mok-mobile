import { useTranslation } from 'react-i18next';
import { Alert, Pressable, Text, View } from 'react-native';
import { formatInBishkek } from '@/shared/lib/date';
import type { StaffSession } from './api';

const caps = 'font-semibold text-[10px] uppercase tracking-[1.4px] text-dim';

export function SessionList({
  list,
  canEnd,
  unavailable,
  endAllLabel,
  sessionText,
  allText,
  onEnd,
}: {
  list: StaffSession[] | null | undefined;
  canEnd: boolean;
  unavailable: string;
  endAllLabel: string;
  sessionText: (session: StaffSession) => string;
  allText: (count: number) => string;
  onEnd: (sessionId: string | null) => void;
}) {
  const { t, i18n } = useTranslation();
  const others = (list ?? []).filter((s) => !s.current);

  const confirm = (session: StaffSession | null) =>
    Alert.alert(
      session ? t('access.endSessionTitle') : t('access.endAllTitle'),
      session ? sessionText(session) : allText(others.length),
      [
        { text: t('access.cancel'), style: 'cancel' },
        {
          text: session ? t('access.endSession') : endAllLabel,
          style: 'destructive',
          onPress: () => onEnd(session ? session.id : null),
        },
      ],
    );

  return (
    <View className="gap-2 rounded-14 border border-line bg-panel p-4">
      <View className="flex-row items-center justify-between gap-3">
        <Text className={caps}>{t('access.devicesTitle')}</Text>
        {canEnd && others.length > 1 && (
          <Pressable accessibilityRole="button" onPress={() => confirm(null)} hitSlop={8}>
            <Text className="font-medium text-[12px] text-danger">{endAllLabel}</Text>
          </Pressable>
        )}
      </View>
      {list === null ? (
        <Text className="font-regular text-[12px] text-dim">{unavailable}</Text>
      ) : list === undefined ? null : list.length === 0 ? (
        <Text className="font-regular text-[12px] text-dim">{t('access.noDevices')}</Text>
      ) : (
        list.map((s) => (
          <View
            key={s.id}
            className="flex-row items-center gap-3 rounded-9 border border-line bg-column px-3 py-[9px]"
          >
            <View className="flex-1">
              <Text numberOfLines={1} className="font-regular text-[12.5px] text-text">
                {s.device}
                {s.current && (
                  <Text className="font-regular text-[11px] text-success">
                    {'  '}
                    {t('access.currentSession')}
                  </Text>
                )}
              </Text>
              <Text className="mt-[2px] font-regular text-[11px] text-dim">
                {t(`access.platform.${s.platform}`)} ·{' '}
                {t('access.lastSeen', {
                  time: formatInBishkek(s.lastSeenAt, 'd MMM, HH:mm', i18n.language),
                })}
              </Text>
            </View>
            {canEnd && !s.current && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${t('access.endSession')}: ${s.device}`}
                onPress={() => confirm(s)}
                className="h-8 justify-center rounded-8 border border-line px-3"
              >
                <Text className="font-medium text-[11.5px] text-sub">{t('access.endSession')}</Text>
              </Pressable>
            )}
          </View>
        ))
      )}
    </View>
  );
}
