import { Image } from 'expo-image';
import { View } from 'react-native';
import type { ThemeName } from '@/shared/config/tokens';

const rings: Record<ThemeName, number[]> = {
  dark: [
    require('./assets/ring-dark-1.svg'),
    require('./assets/ring-dark-2.svg'),
    require('./assets/ring-dark-3.svg'),
    require('./assets/ring-dark-4.svg'),
    require('./assets/ring-dark-5.svg'),
  ],
  light: [
    require('./assets/ring-light-1.svg'),
    require('./assets/ring-light-2.svg'),
    require('./assets/ring-light-3.svg'),
    require('./assets/ring-light-4.svg'),
    require('./assets/ring-light-5.svg'),
  ],
};

/** Пять колец из макета (mobile: 34px, шаг 26px). У каждой темы свой набор цветов */
export function OlympicRings({ theme }: { theme: ThemeName }) {
  return (
    <View accessibilityRole="image" accessibilityLabel="НОК КР" style={{ width: 138, height: 34 }}>
      {rings[theme].map((source, i) => (
        <Image
          key={source}
          source={source}
          style={{ position: 'absolute', left: i * 26, top: 0, width: 34, height: 34 }}
        />
      ))}
    </View>
  );
}
