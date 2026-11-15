import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import i18n from '@/app/i18n';
import { AppProviders } from '@/app/providers';

export async function renderScreen(ui: ReactElement) {
  await i18n.changeLanguage('ru');
  return render(<AppProviders>{ui}</AppProviders>);
}
