import { Moon, Sun, SunMoon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { type ThemeMode, useTheme } from '@/app/providers/ThemeProvider';
import { brand, themes } from '@/shared/config/tokens';

type Props<T extends ThemeMode> = {
  value: T;
  onChange: (mode: T) => void;
  labels: { dark: string; light: string; system?: string };
};

export function ThemeSwitch<T extends ThemeMode>({ value, onChange, labels }: Props<T>) {
  const palette = themes[useTheme().theme];
  const options = [
    { mode: 'dark', Icon: Moon, label: labels.dark, color: brand['brand-gold'] },
    { mode: 'light', Icon: Sun, label: labels.light, color: palette.warning },
    ...(labels.system
      ? [{ mode: 'system', Icon: SunMoon, label: labels.system, color: palette.info }]
      : []),
  ] as { mode: T; Icon: typeof Moon; label: string; color: string }[];
  return (
    <View
      accessibilityRole="radiogroup"
      className="h-[30px] flex-row items-center gap-[10px] rounded-full border border-line bg-control px-[2.5px]"
    >
      {options.map(({ mode, Icon, label, color }) => {
        const active = mode === value;
        return (
          <Pressable
            key={mode}
            accessibilityRole="radio"
            accessibilityLabel={label}
            accessibilityState={{ checked: active }}
            onPress={() => onChange(mode)}
            hitSlop={6}
            className={`size-[23px] items-center justify-center rounded-full ${
              active ? 'bg-control-active' : ''
            }`}
          >
            <Icon size={12} color={active ? color : palette.faint} />
          </Pressable>
        );
      })}
    </View>
  );
}
