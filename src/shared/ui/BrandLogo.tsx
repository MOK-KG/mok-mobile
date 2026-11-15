import { Image } from 'expo-image';
import type { ThemeName } from '@/shared/config/tokens';

const sources: Record<ThemeName, number> = {
  dark: require('./assets/logo-white.svg'),
  light: require('./assets/logo-color.svg'),
};

export function BrandLogo({ theme, height }: { theme: ThemeName; height: number }) {
  return (
    <Image
      accessibilityRole="image"
      accessibilityLabel="НОК КР"
      source={sources[theme]}
      contentFit="contain"
      style={{ width: Math.round((height * 131.34) / 226.26), height }}
    />
  );
}
