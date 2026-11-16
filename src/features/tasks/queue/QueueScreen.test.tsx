import { fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { fakeApi } from '@/test/fakeApi';
import { renderScreen } from '@/test/render';
import { QueueScreen } from './QueueScreen';

const person = {
  id: 9,
  email: 'nb@olympic.kg',
  name: 'Нурлан Бакиров',
  position: 'Специалист',
  department: 'Медицинский',
};

const letter = (id: string, subject: string, confidence: number | null, low = false) => ({
  id,
  sender: 'МОК · Лозанна',
  address: 'compliance@olympic.org',
  organization: 'IOC',
  subject,
  receivedAt: new Date().toISOString(),
  body: 'text',
  attachments: [],
  suggestion:
    confidence === null && !low
      ? null
      : {
          title: 'Подготовить ответ',
          assignee: person,
          due: '2026-12-01',
          project: null,
          priority: 'normal',
          flags: {},
          reasoning: '',
          sources: [],
          confidence,
          lowConfidence: low,
        },
});

it('puts low-confidence letters into manual review and opens their suggestion', async () => {
  fakeApi(
    {
      'GET /tasks/mail/letters': [
        letter('l-1', 'Anti-doping report', 90),
        letter('l-2', 'Unclear request', 35, true),
        letter('l-3', 'Scanned letter', null),
      ],
      'GET /tasks/mail/summary': { ready: 1, manual: 2 },
    },
    ['tasks.view', 'tasks.create'],
  );
  await renderScreen(<QueueScreen />);
  expect(await screen.findByText('низкая уверенность · 35%')).toBeTruthy();
  expect(screen.getByText('Разобрать вручную')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('МОК · Лозанна. Unclear request'));
  expect(router.push).toHaveBeenCalledWith('/tasks/letter/l-2');
  await fireEvent.press(screen.getByLabelText('МОК · Лозанна. Scanned letter'));
  expect(router.push).toHaveBeenCalledWith('/tasks/new?letter=l-3');
});
