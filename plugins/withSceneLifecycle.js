/**
 * Переводит iOS-приложение на сценовый жизненный цикл UIKit (UIScene).
 *
 * iOS 27 SDK (Xcode 27) не запускает приложения без UIScene, а шаблон Expo SDK 57
 * пока создаёт окно в AppDelegate. Expo уже содержит ExpoAppSceneDelegate — плагин подключает его:
 * - AppDelegate реализует ExpoReactNativeFactoryProvider и больше не создаёт окно сам;
 * - в Info.plist объявляется сцена с делегатом EXExpoAppSceneDelegate.
 *
 * Удалить, когда шаблон Expo начнёт делать это сам.
 */
const { withAppDelegate, withInfoPlist } = require('expo/config-plugins');

const CLASS_DECL = 'class AppDelegate: ExpoAppDelegate {';
const CLASS_DECL_WITH_PROVIDER =
  'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {';
const WINDOW_BLOCK =
  /\n#if os\(iOS\) \|\| os\(tvOS\)\n\s*window = UIWindow\(frame: UIScreen\.main\.bounds\)\n\s*factory\.startReactNative\([\s\S]*?\)\n#endif\n/;

const withSceneAppDelegate = (config) =>
  withAppDelegate(config, (cfg) => {
    if (cfg.modResults.language !== 'swift') {
      throw new Error('withSceneLifecycle: ожидается AppDelegate.swift');
    }
    let src = cfg.modResults.contents;
    if (!src.includes(CLASS_DECL_WITH_PROVIDER)) {
      if (!src.includes(CLASS_DECL) || !WINDOW_BLOCK.test(src)) {
        throw new Error('withSceneLifecycle: шаблон AppDelegate изменился, проверьте плагин');
      }
      src = src
        .replace(CLASS_DECL, CLASS_DECL_WITH_PROVIDER)
        .replace(
          WINDOW_BLOCK,
          '\n    // Окно и запуск React Native — в ExpoAppSceneDelegate (UIScene)\n',
        );
    }
    cfg.modResults.contents = src;
    return cfg;
  });

const withSceneManifest = (config) =>
  withInfoPlist(config, (cfg) => {
    cfg.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: 'EXExpoAppSceneDelegate',
          },
        ],
      },
    };
    return cfg;
  });

module.exports = (config) => withSceneManifest(withSceneAppDelegate(config));
