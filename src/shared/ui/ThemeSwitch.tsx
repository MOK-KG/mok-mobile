import { Moon, Sun } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { brand, type ThemeName, themes } from '@/shared/config/tokens';

type Props = {
  value: ThemeName;
  onChange: (theme: ThemeName) => void;
  labels: { dark: string; light: string };
};

/** Переключатель темы: луна / солнце (сегменты в «таблетке») */
export function ThemeSwitch({ value, onChange, labels }: Props) {
  const palette = themes[value];
  const options = [
    { theme: 'dark' as const, Icon: Moon, label: labels.dark, color: brand['brand-gold'] },
    { theme: 'light' as const, Icon: Sun, label: labels.light, color: palette.warning },
  ];
  return (
    <View
      accessibilityRole="radiogroup"
      className="h-[30px] flex-row items-center gap-[10px] rounded-full border border-line bg-control px-[2.5px]"
    >
      {options.map(({ theme, Icon, label, color }) => {
        const active = theme === value;
        return (
          <Pressable
            key={theme}
            accessibilityRole="radio"
            accessibilityLabel={label}
            accessibilityState={{ checked: active }}
            onPress={() => onChange(theme)}
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
