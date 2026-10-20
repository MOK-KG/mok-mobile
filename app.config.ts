import type { ExpoConfig } from 'expo/config';

/**
 * Конфигурация Expo.
 *
 * Пометки TODO(release) — временные значения, которые нужно заменить до публикации
 * в App Store и Google Play. Поиск: `grep -rn "TODO(release)" .`
 */

// TODO(release): тестовый идентификатор. Заменить на идентификатор организации
// (например, kg.olympic.nokkr) до регистрации приложения в App Store Connect и Google Play.
// После регистрации идентификатор сменить нельзя: это будет другое приложение.
const APP_ID = 'com.nokkr.dev';

const config: ExpoConfig = {
  name: 'НОК КР',
  slug: 'nok-kr',
  version: '1.0.0',
  orientation: 'portrait',
  // TODO(release): иконки и сплэш — заглушки из шаблона Expo, заменить на брендовые НОК КР.
  icon: './assets/images/icon.png',
  // TODO(release): схема deep link. Согласовать с OAuth-провайдером (expo-auth-session):
  // redirect URI вида nokkr://...
  scheme: 'nokkr',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: APP_ID,
    icon: './assets/expo.icon',
  },
  android: {
    package: APP_ID,
    adaptiveIcon: {
      backgroundColor: '#0A1628',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    // Маршруты в src/app/routes, провайдеры в src/app/providers
    ['expo-router', { root: './src/app/routes' }],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#0A1628',
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
      },
    ],
    'expo-secure-store',
    'expo-notifications',
    '@react-native-community/datetimepicker',
    'expo-font',
    // Сценовый жизненный цикл UIKit для iOS 27 SDK; удалить, когда шаблон Expo начнёт делать это сам
    './plugins/withSceneLifecycle',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
