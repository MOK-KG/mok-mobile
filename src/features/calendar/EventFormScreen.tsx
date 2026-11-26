import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/app/providers/ThemeProvider';
import { MemberChecklist } from '@/features/chat/MemberChecklist';
import { ApiError } from '@/shared/api/client';
import { errorText } from '@/shared/api/feedback';
import { themes } from '@/shared/config/tokens';
import { formatIsoDate } from '@/shared/lib/date';
import type { IsoDate } from '@/shared/lib/workDays';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import { useCalendarConnection, useCreateEvent } from './events';

const TIME = /^([01]?\d|2[0-3]):[0-5]\d$/;

export function EventFormScreen({ day }: { day: IsoDate }) {
  const { t, i18n } = useTranslation();
  const palette = themes[useTheme().theme];
  const connection = useCalendarConnection().data;
  const googleReady = Boolean(connection?.connected && !connection.needsReconnect);
  const create = useCreateEvent();
  const [title, setTitle] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [start, setStart] = useState('10:00');
  const [end, setEnd] = useState('11:00');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [attendees, setAttendees] = useState<Set<string>>(new Set());
  const [google, setGoogle] = useState(true);
  const fields = create.error instanceof ApiError ? (create.error.fields ?? {}) : {};
  const fieldError = (key: string) => (fields[key] ? errorText(create.error, t) : null);
  const timesValid = allDay || (TIME.test(start) && (end === '' || TIME.test(end)));
  const ready = title.trim().length > 0 && timesValid && !create.isPending;

  const toggle = (id: string) =>
    setAttendees((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const submit = () => {
    if (!ready) return;
    create.mutate(
      {
        title: title.trim(),
        date: day,
        startTime: allDay ? null : start,
        endTime: allDay ? null : end || null,
        description: description.trim(),
        location: location.trim(),
        attendeeIds: [...attendees],
        google: googleReady && google,
      },
      { onSuccess: () => router.back() },
    );
  };

  const input =
    'h-11 rounded-9 border border-line bg-column px-3 font-regular text-[14px] text-text';
  const caption = 'font-medium text-[12px] text-faint';

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <ScreenHeader title={t('calendar.newEvent')} fallback="/calendar" />
      <ScrollView contentContainerClassName="gap-4 p-4 pb-10" keyboardShouldPersistTaps="handled">
        <View className="gap-[6px]">
          <Text className={caption}>{t('calendar.eventTitle')}</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            maxLength={300}
            accessibilityLabel={t('calendar.eventTitle')}
            className={input}
          />
          {fieldError('title') && (
            <Text className="font-regular text-[12px] text-danger">{fieldError('title')}</Text>
          )}
        </View>

        <View className="gap-[6px]">
          <Text className={caption}>{t('calendar.eventDate')}</Text>
          <Text className="font-medium text-[14px] text-text">
            {formatIsoDate(day, 'EEEE, d MMMM yyyy', i18n.language)}
          </Text>
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="font-regular text-[14px] text-text">{t('calendar.allDay')}</Text>
          <Switch
            accessibilityLabel={t('calendar.allDay')}
            value={allDay}
            onValueChange={setAllDay}
            trackColor={{ false: palette.control, true: palette.info }}
          />
        </View>

        {!allDay && (
          <View className="flex-row gap-3">
            <View className="flex-1 gap-[6px]">
              <Text className={caption}>{t('calendar.eventStart')}</Text>
              <TextInput
                value={start}
                onChangeText={setStart}
                placeholder="10:00"
                placeholderTextColor={palette.dim}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                accessibilityLabel={t('calendar.eventStart')}
                className={`${input} ${TIME.test(start) ? '' : 'border-danger'}`}
              />
              {fieldError('startTime') && (
                <Text className="font-regular text-[12px] text-danger">
                  {fieldError('startTime')}
                </Text>
              )}
            </View>
            <View className="flex-1 gap-[6px]">
              <Text className={caption}>{t('calendar.eventEnd')}</Text>
              <TextInput
                value={end}
                onChangeText={setEnd}
                placeholder="11:00"
                placeholderTextColor={palette.dim}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                accessibilityLabel={t('calendar.eventEnd')}
                className={`${input} ${end === '' || TIME.test(end) ? '' : 'border-danger'}`}
              />
              {fieldError('endTime') && (
                <Text className="font-regular text-[12px] text-danger">
                  {fieldError('endTime')}
                </Text>
              )}
            </View>
          </View>
        )}

        <View className="gap-[6px]">
          <Text className={caption}>{t('calendar.eventLocation')}</Text>
          <TextInput
            value={location}
            onChangeText={setLocation}
            accessibilityLabel={t('calendar.eventLocation')}
            className={input}
          />
        </View>

        <View className="gap-[6px]">
          <Text className={caption}>{t('calendar.eventDescription')}</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            multiline
            accessibilityLabel={t('calendar.eventDescription')}
            className="min-h-20 rounded-9 border border-line bg-column px-3 py-2 font-regular text-[14px] text-text"
          />
        </View>

        <View className="gap-[6px]">
          <Text className={caption}>
            {t('calendar.eventAttendees')}
            {attendees.size > 0 ? ` · ${attendees.size}` : ''}
          </Text>
          <View className="rounded-11 border border-line bg-panel p-1">
            <MemberChecklist selected={attendees} onToggle={toggle} />
          </View>
        </View>

        {googleReady ? (
          <View className="flex-row items-center gap-3">
            <Text className="flex-1 font-regular text-[13px] leading-[18px] text-sub">
              {t('calendar.toGoogle', { email: connection?.email })}
            </Text>
            <Switch
              accessibilityLabel={t('calendar.toGoogle', { email: connection?.email })}
              value={google}
              onValueChange={setGoogle}
              trackColor={{ false: palette.control, true: palette.info }}
            />
          </View>
        ) : (
          <Text className="font-regular text-[12.5px] leading-[18px] text-dim">
            {t('calendar.googleNotConnected')}
          </Text>
        )}

        {create.error && Object.keys(fields).length === 0 && (
          <Text accessibilityRole="alert" className="font-regular text-[12.5px] text-danger">
            {errorText(create.error, t)}
          </Text>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !ready }}
          disabled={!ready}
          onPress={submit}
          className={`h-11 items-center justify-center rounded-9 bg-brand-red ${ready ? '' : 'opacity-50'}`}
        >
          <Text className="font-semibold text-[14px] text-[#FFFFFF]">
            {t('calendar.createEvent')}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
