import { fireEvent, screen } from '@testing-library/react-native';
import { fakeApi } from '@/test/fakeApi';
import { renderScreen } from '@/test/render';
import { GraphScreen } from './GraphScreen';

const graph = {
  nodes: [
    {
      id: 'doc:ustav',
      kind: 'article',
      title: 'Устав',
      slug: 'ustav',
      sectionId: 's1',
      sectionName: 'Общие',
      degree: 2,
    },
    {
      id: 'doc:fin',
      kind: 'article',
      title: 'Смета',
      slug: 'fin',
      sectionId: 's2',
      sectionName: 'Финансы',
      degree: 1,
    },
    {
      id: 'doc:pr',
      kind: 'article',
      title: 'Регламент',
      slug: 'pr',
      sectionId: 's1',
      sectionName: 'Общие',
      degree: 1,
    },
  ],
  links: [
    { source: 'doc:pr', target: 'doc:ustav', kind: 'link' },
    { source: 'doc:fin', target: 'doc:ustav', kind: 'link' },
  ],
};

it('counts articles and links and hides a section', async () => {
  fakeApi({ 'GET /knowledge/graph': graph }, ['knowledge.view']);
  await renderScreen(<GraphScreen />);
  expect(await screen.findByText('Статей: 3 · связей: 2')).toBeTruthy();
  await fireEvent.press(screen.getByText('Финансы'));
  expect(screen.getByText('Статей: 2 · связей: 1')).toBeTruthy();
  expect(screen.queryByText('Задачи')).toBeNull();
});
