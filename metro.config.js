const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// inlineRem: 16 — как в браузере, чтобы rem-размеры шрифтов совпадали с web
module.exports = withNativeWind(config, { input: './src/global.css', inlineRem: 16 });
