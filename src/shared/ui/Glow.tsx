import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

type Props = {
  color: string;
  /** Непрозрачность в центре */
  opacity: number;
  /** Диаметр области свечения, px */
  size: number;
  left: number;
  top: number;
};

/**
 * Мягкое свечение фона. В макете это круг с размытием (feGaussianBlur), но expo-image
 * на iOS не поддерживает SVG-фильтры, поэтому то же размытие передаём радиальным градиентом.
 */
export function Glow({ color, opacity, size, left, top }: Props) {
  const id = `glow-${color.replace('#', '')}-${size}`;
  return (
    <Svg width={size} height={size} style={{ position: 'absolute', left, top }}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={color} stopOpacity={opacity} />
          <Stop offset="0.35" stopColor={color} stopOpacity={opacity * 0.8} />
          <Stop offset="0.65" stopColor={color} stopOpacity={opacity * 0.3} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
    </Svg>
  );
}
