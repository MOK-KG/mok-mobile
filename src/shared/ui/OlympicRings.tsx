import { Image } from 'expo-image';
import { View } from 'react-native';
import type { ThemeName } from '@/shared/config/tokens';

const rings: Record<ThemeName, { id: string; source: number }[]> = {
  dark: [
    { id: 'dark-1', source: require('./assets/ring-dark-1.svg') },
    { id: 'dark-2', source: require('./assets/ring-dark-2.svg') },
    { id: 'dark-3', source: require('./assets/ring-dark-3.svg') },
    { id: 'dark-4', source: require('./assets/ring-dark-4.svg') },
    { id: 'dark-5', source: require('./assets/ring-dark-5.svg') },
  ],
  light: [
    { id: 'light-1', source: require('./assets/ring-light-1.svg') },
    { id: 'light-2', source: require('./assets/ring-light-2.svg') },
    { id: 'light-3', source: require('./assets/ring-light-3.svg') },
    { id: 'light-4', source: require('./assets/ring-light-4.svg') },
    { id: 'light-5', source: require('./assets/ring-light-5.svg') },
  ],
};

/** Пять колец из макета (mobile: 34px, шаг 26px). У каждой темы свой набор цветов */
export function OlympicRings({ theme }: { theme: ThemeName }) {
  return (
    <View accessibilityRole="image" accessibilityLabel="НОК КР" style={{ width: 138, height: 34 }}>
      {rings[theme].map((ring, i) => (
        <Image
          key={ring.id}
          source={ring.source}
          style={{ position: 'absolute', left: i * 26, top: 0, width: 34, height: 34 }}
        />
      ))}
    </View>
  );
}
