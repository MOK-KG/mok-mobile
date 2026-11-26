import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { fakeApi } from '@/test/fakeApi';
import { renderScreen } from '@/test/render';
import { BotScreen, toMobilePath } from './BotScreen';

const at = '2026-11-26T09:00:00+06:00';

const action = {
  id: 'a1',
  kind: 'create_task',
  status: 'pending',
  preview: {
    title: 'Подготовить ответ федерации',
    fields: [{ key: 'due', value: '27 ноября' }],
    warnings: [],
  },
  result: {},
  error: '',
  decidedAt: null,
};

const conversation = {
  available: true,
  conversation: { id: 3, title: 'Задачи', updatedAt: at },
  notesUrl: null,
  messages: [
    {
      id: 1,
      role: 'user',
      text: 'Поставь задачу',
      status: 'done',
      error: '',
      action: null,
      sources: [],
      steps: [],
      at,
    },
    {
      id: 2,
      role: 'assistant',
      text: 'Готово, **проверьте** карточку',
      status: 'done',
      error: '',
      action: null,
      sources: [{ kind: 'task', title: 'ЗД-2026-0001 · Отчёт', url: '/tasks?task=t-1' }],
      steps: [],
      at,
    },
    {
      id: 3,
      role: 'action',
      text: '',
      status: 'done',
      error: '',
      action,
      sources: [],
      steps: [],
      at,
    },
  ],
};

it('maps web links to mobile screens', () => {
  expect(toMobilePath('/tasks?task=t-1')).toBe('/tasks/t-1');
  expect(toMobilePath('/chat?c=5')).toBe('/chat/5');
  expect(toMobilePath('/knowledge/ustav')).toBe('/knowledge/ustav');
});

it('shows the answer with sources and confirms an action card', async () => {
  const calls = fakeApi(
    {
      'GET /assistant/bot': conversation,
      'GET /assistant/bot/conversations': [conversation.conversation],
      'POST /assistant/bot/actions/a1/confirm': {
        ...action,
        status: 'done',
        result: { taskId: 't-9', code: 'ЗД-2026-0009' },
      },
    },
    ['chat.use', 'tasks.view', 'tasks.create'],
  );
  await renderScreen(<BotScreen />);
  expect(await screen.findByText('проверьте')).toBeTruthy();
  await fireEvent.press(screen.getByText('ЗД-2026-0001 · Отчёт'));
  expect(router.push).toHaveBeenCalledWith('/tasks/t-1');
  expect(screen.getByText('Подготовить ответ федерации')).toBeTruthy();
  await fireEvent.press(screen.getByText('Создать'));
  await waitFor(() =>
    expect(calls.some((c) => c.path === '/assistant/bot/actions/a1/confirm')).toBe(true),
  );
  expect(await screen.findByText('· ЗД-2026-0009')).toBeTruthy();
});

it('sends a question from the welcome examples', async () => {
  const calls = fakeApi(
    {
      'GET /assistant/bot': { available: true, conversation: null, notesUrl: null, messages: [] },
      'GET /assistant/bot/conversations': [],
      'POST /assistant/bot': {
        id: 9,
        conversationId: 4,
        role: 'user',
        text: 'x',
        status: 'pending',
        error: '',
        action: null,
        sources: [],
        steps: [],
        at,
      },
    },
    ['chat.use'],
  );
  await renderScreen(<BotScreen />);
  await fireEvent.press(
    await screen.findByText('Какие у меня задачи на этой неделе и что просрочено?'),
  );
  await waitFor(() =>
    expect(
      calls.find((c) => c.method === 'POST' && c.path === '/assistant/bot')?.body,
    ).toMatchObject({
      text: 'Какие у меня задачи на этой неделе и что просрочено?',
    }),
  );
});
