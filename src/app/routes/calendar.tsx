import { RequirePermission } from '@/features/auth';
import { CalendarScreen } from '@/features/calendar/CalendarScreen';

/** Календарь — из вкладки «Ещё»; без права — 403 */
export default function CalendarRoute() {
  return (
    <RequirePermission permission="calendar.view">
      <CalendarScreen />
    </RequirePermission>
  );
}
