require('react-native-gesture-handler/jestSetup');

jest.mock('@gorhom/bottom-sheet', () => require('@gorhom/bottom-sheet/mock'));

jest.mock('@/shared/lib/storage', () => {
  const values = new Map<string, string>();
  return {
    storage: {
      get: (key: string) => values.get(key) ?? null,
      set: (key: string, value: string) => values.set(key, value),
      remove: (key: string) => values.delete(key),
    },
  };
});

jest.mock('react-native-worklets', () => require('react-native-worklets/lib/module/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

jest.mock('expo-router', () => ({
  ...jest.requireActual('expo-router'),
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => false },
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
  useNavigation: () => ({ addListener: () => () => {}, setOptions: () => {} }),
}));
