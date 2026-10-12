import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { type ThemeName, themes } from '@/shared/config/tokens';

type Props = {
  label: string;
  onPress: () => void;
  theme: ThemeName;
  loading?: boolean;
};

/** Кнопка входа через Google. В тёмной теме светлая, в светлой — тёмная (макет) */
export function GoogleButton({ label, onPress, theme, loading = false }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: loading }}
      disabled={loading}
      onPress={onPress}
      className={`h-14 flex-row items-center rounded-14 bg-text px-[18px] active:opacity-80 ${
        loading ? 'opacity-50' : ''
      }`}
    >
      <Image source={require('./assets/google.svg')} style={{ width: 20, height: 20 }} />
      <Text
        className="ml-3 flex-1 font-semibold text-[15px] tracking-[-0.1px] text-panel"
        numberOfLines={1}
      >
        {label}
      </Text>
      {loading ? (
        <ActivityIndicator size="small" color={themes[theme].faint} />
      ) : (
        <View>
          <Text className="font-medium text-[15px] text-faint">→</Text>
        </View>
      )}
    </Pressable>
  );
}
