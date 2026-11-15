import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import * as ReactNative from 'react-native';
import { storage } from '@/shared/lib/storage';
import { ThemeProvider, useTheme } from './ThemeProvider';

const wrapper = ({ children }: { children: ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

let scheme: 'light' | 'dark' = 'light';

beforeEach(() => {
  storage.remove('nok.theme');
  scheme = 'light';
  jest.spyOn(ReactNative, 'useColorScheme').mockImplementation(() => scheme);
});

afterEach(() => jest.restoreAllMocks());

it('follows the system theme by default', async () => {
  const { result } = await renderHook(() => useTheme(), { wrapper });
  expect(result.current.mode).toBe('system');
  expect(result.current.theme).toBe('light');
});

it('uses dark when the system is dark', async () => {
  scheme = 'dark';
  const { result } = await renderHook(() => useTheme(), { wrapper });
  expect(result.current.theme).toBe('dark');
});

it('keeps an explicit choice and can go back to the system', async () => {
  const { result } = await renderHook(() => useTheme(), { wrapper });
  await act(async () => result.current.setMode('dark'));
  expect(result.current.theme).toBe('dark');
  expect(storage.get('nok.theme')).toBe('dark');

  await act(async () => result.current.setMode('system'));
  expect(result.current.theme).toBe('light');
  expect(storage.get('nok.theme')).toBe('system');
});

it('restores a saved choice', async () => {
  storage.set('nok.theme', 'dark');
  const { result } = await renderHook(() => useTheme(), { wrapper });
  expect(result.current.mode).toBe('dark');
  expect(result.current.theme).toBe('dark');
});
