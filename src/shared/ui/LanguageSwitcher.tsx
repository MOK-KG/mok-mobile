import { Pressable, Text, View } from 'react-native';
import { type Language, languageLabels, languages } from '@/shared/config/i18n';

type Props = {
  value: Language;
  onChange: (language: Language) => void;
};

/** Переключатель языка RU / KY / EN (сегменты в «таблетке») */
export function LanguageSwitcher({ value, onChange }: Props) {
  return (
    <View
      accessibilityRole="radiogroup"
      className="h-[30px] flex-row items-center rounded-full border border-line bg-control px-[3px]"
    >
      {languages.map((lng) => {
        const active = lng === value;
        return (
          <Pressable
            key={lng}
            accessibilityRole="radio"
            accessibilityLabel={languageLabels[lng]}
            accessibilityState={{ checked: active }}
            onPress={() => onChange(lng)}
            hitSlop={6}
            className={`h-[22px] w-8 items-center justify-center rounded-full ${
              active ? 'bg-control-active' : ''
            }`}
          >
            <Text
              className={`text-[10px] uppercase tracking-[0.3px] ${
                active ? 'font-semibold text-text' : 'font-medium text-faint'
              }`}
            >
              {lng}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
