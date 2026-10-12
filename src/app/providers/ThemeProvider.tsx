import { StatusBar } from 'expo-status-bar';
import { colorScheme, vars } from 'nativewind';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { defaultTheme, type ThemeName, themes, themeVars } from '@/shared/config/tokens';

type ThemeContextValue = {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

// CSS-переменные тем для NativeWind: bg-canvas → var(--color-canvas)
const themeStyles = {
  dark: vars(themeVars('dark')),
  light: vars(themeVars('light')),
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>(defaultTheme);

  useEffect(() => {
    // включает вариант dark: в классах NativeWind
    colorScheme.set(theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <View style={[{ flex: 1, backgroundColor: themes[theme].canvas }, themeStyles[theme]]}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
