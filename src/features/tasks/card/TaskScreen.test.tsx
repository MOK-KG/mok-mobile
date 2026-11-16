import { fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { fakeApi } from '@/test/fakeApi';
import { renderScreen } from '@/test/render';
import { TaskScreen } from './TaskScreen';

const person = {
  id: 9,
  email: 'nb@olympic.kg',
  name: 'Нурлан Бакиров',
  position: 'Специалист',
  department: 'Медицинский',
};

const letter = (id: string, subject: string, body: string, followUp: boolean) => ({
  id,
  sender: 'МОК · Лозанна',
  address: 'compliance@olympic.org',
  subject,
  body,
  receivedAt: '2026-11-14T11:30:00+06:00',
  followUp,
  attachments: followUp ? 2 : 0,
});

const task = {
  id: 't-1',
  code: 'ЗД-2026-0001',
  title: 'Обновить антидопинговый отчёт',
  status: 'in_progress',
  columnId: 'c-2',
  position: 0,
  project: null,
  due: null,
  assignee: person,
  author: person,
  deputy: null,
  priority: 'normal',
  subtasks: 0,
  comments: 0,
  attachments: 0,
  fromEmail: true,
  reschedules: 0,
  escalationHours: null,
  description: 'Please provide the report.',
  knowledgeLink: { id: 'antidoping', title: 'Антидопинговые правила' },
  subtaskItems: [],
  commentItems: [],
  attachmentItems: [],
  history: [
    {
      id: 'h-2',
      kind: 'letter',
      text: 'МОК · Лозанна|Re: Anti-doping report',
      at: '2026-11-14T11:30:00+06:00',
    },
    { id: 'h-1', kind: 'created', text: 'email', at: '2026-11-10T09:00:00+06:00' },
  ],
  rescheduleLog: [],
  letters: [
    letter('l-1', 'Anti-doping report', 'Please provide the report.', false),
    letter('l-2', 'Re: Anti-doping report', 'Any update?', true),
  ],
  reminderDays: null,
  escalatedAt: null,
  source: { kind: 'email', mailbox: 'info@olympic.kg', at: '2026-11-10T09:00:00+06:00' },
  department: 'Медицинский',
};

it('shows the correspondence with the latest reply expanded', async () => {
  fakeApi({ 'GET /tasks/items/t-1': task }, ['tasks.view']);
  await renderScreen(<TaskScreen taskId="t-1" />);
  expect(await screen.findByText('Переписка · 2 письма')).toBeTruthy();
  expect(screen.getByText('Any update?')).toBeTruthy();
  expect(screen.getByText(/2 вложения/)).toBeTruthy();
  expect(screen.getByText('Пришёл ответ: МОК · Лозанна — «Re: Anti-doping report»')).toBeTruthy();

  await fireEvent.press(screen.getByText('Anti-doping report'));
  expect(screen.queryByText('Any update?')).toBeNull();
});

it('opens the linked knowledge base article itself', async () => {
  fakeApi({ 'GET /tasks/items/t-1': task }, ['tasks.view']);
  await renderScreen(<TaskScreen taskId="t-1" />);
  await fireEvent.press(await screen.findByText(/Антидопинговые правила/));
  expect(router.push).toHaveBeenCalledWith('/knowledge/antidoping');
});
