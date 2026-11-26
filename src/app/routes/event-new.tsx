import { useLocalSearchParams } from 'expo-router';
import { RequirePermission } from '@/features/auth';
import { EventFormScreen } from '@/features/calendar/EventFormScreen';
import { type IsoDate, todayInBishkek } from '@/shared/lib/workDays';

export default function EventNewRoute() {
  const { d } = useLocalSearchParams<{ d?: string }>();
  const day = d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? (d as IsoDate) : todayInBishkek();
  return (
    <RequirePermission permission="calendar.view">
      <EventFormScreen day={day} />
    </RequirePermission>
  );
}
