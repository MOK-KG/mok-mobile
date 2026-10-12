module.exports = (api) => {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    overrides: [
      {
        // NativeWind (className) — только для нашего кода. Его JSX-обёртка в node_modules
        // теряет style-функции у Pressable: например, уведомления LogBox становятся белыми
        // без текста.
        // Функция, а не RegExp: Metro загружает конфиг и без имени файла (для ключа кэша)
        exclude: (filename) => Boolean(filename?.includes('node_modules')),
        presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
      },
    ],
  };
};
