import type { Config } from 'tailwindcss';
import {
  fontWeights,
  tailwindBorderRadius,
  tailwindColors,
  tailwindSpacing,
} from './src/shared/config/tokens';

// У пресета NativeWind нет типов для ESM-импорта, подключаем как в документации
const nativewindPreset = require('nativewind/preset');

// В React Native у каждого начертания своё имя семейства (см. src/app/_layout.tsx)
const inter = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} satisfies Record<keyof typeof fontWeights, string>;

export default {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [nativewindPreset],
  // Тема переключается вручную через ThemeProvider (CSS-переменные через vars())
  darkMode: 'class',
  theme: {
    colors: tailwindColors,
    borderRadius: tailwindBorderRadius,
    spacing: tailwindSpacing,
    fontWeight: fontWeights,
    fontFamily: {
      // font-regular / font-medium / font-semibold / font-bold задают и вес, и файл шрифта.
      // font-sans нет намеренно: на iOS семейство без веса не подхватывается
      regular: [inter.regular],
      medium: [inter.medium],
      semibold: [inter.semibold],
      bold: [inter.bold],
    },
    extend: {},
  },
} satisfies Config;
