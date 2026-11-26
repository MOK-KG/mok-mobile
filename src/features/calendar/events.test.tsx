import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { fakeApi, me } from '@/test/fakeApi';
import { renderScreen } from '@/test/render';
import { CalendarScreen } from './CalendarScreen';
import { EventFormScreen } from './EventFormScreen';

const person = { id: String(me.id), email: 'me@olympic.kg', name: me.name };

const event = (patch: object) => ({
  id: 'e1',
  title: 'Встреча с федерацией бокса',
  description: '',
  location: 'Зал 2',
  date: '2026-12-02',
  startTime: '10:00',
  endTime: '11:00',
  allDay: false,
  createdBy: person,
  attendees: [],
  task: null,
  googleLink: '',
  googleError: '',
  source: 'platform',
  ...patch,
});

afterEach(() => jest.mocked(useLocalSearchParams).mockReturnValue({}));

it('shows the day events and cancels my own event', async () => {
  jest.mocked(useLocalSearchParams).mockReturnValue({ d: '2026-12-02' });
  const calls = fakeApi(
    {
      'GET /calendar/events': [
        event({}),
        event({ id: 'g1', title: 'Из Google', source: 'google', startTime: null, endTime: null }),
      ],
      'GET /tasks/board': {
        columns: [],
        tasks: [],
        counts: { mine: 0, department: 0, createdByMe: 0, completed: 0 },
      },
      'GET /staff/absences': [],
      'POST /calendar/events/e1/cancel': event({}),
    },
    ['calendar.view', 'tasks.view'],
  );
  await renderScreen(<CalendarScreen />);
  expect(await screen.findByText(/Встреча с федерацией бокса/)).toBeTruthy();
  expect(screen.getByText('из Google')).toBeTruthy();
  expect(screen.getAllByText('Отменить')).toHaveLength(1);
  await fireEvent.press(screen.getByText('Отменить'));
  await waitFor(() =>
    expect(calls.some((c) => c.path === '/calendar/events/e1/cancel')).toBe(true),
  );
  await fireEvent.press(screen.getByText('Новое событие'));
  expect(router.push).toHaveBeenCalledWith('/event-new?d=2026-12-02');
});

it('creates an event with time and an attendee', async () => {
  const calls = fakeApi(
    {
      'GET /calendar/google': {
        connected: false,
        email: null,
        connectedAt: null,
        needsReconnect: false,
        lastError: '',
      },
      'GET /chat/members': [
        {
          id: '9',
          email: 'nb@olympic.kg',
          name: 'Нурлан Бакиров',
          position: '',
          department: 'Медицинский',
          role: 'R5',
          active: true,
        },
      ],
      'POST /calendar/events': (body: unknown) => event(body as object),
    },
    ['calendar.view', 'chat.use'],
  );
  await renderScreen(<EventFormScreen day="2026-12-02" />);
  expect(screen.getByText(/Google Календарь не подключён/)).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Название'), 'Планёрка');
  await fireEvent.changeText(screen.getByLabelText('Начало'), '9:30');
  await fireEvent.press(await screen.findByRole('checkbox', { name: 'Нурлан Бакиров' }));
  await fireEvent.press(screen.getByText('Создать'));
  await waitFor(() =>
    expect(calls.find((c) => c.method === 'POST')?.body).toMatchObject({
      title: 'Планёрка',
      date: '2026-12-02',
      startTime: '9:30',
      endTime: '11:00',
      attendeeIds: ['9'],
      google: false,
    }),
  );
  expect(router.back).toHaveBeenCalled();
});
