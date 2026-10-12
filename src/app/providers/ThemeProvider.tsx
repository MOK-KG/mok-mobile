import {
  DarkTheme,
  DefaultTheme,
  type Theme as NavigationTheme,
  ThemeProvider as NavigationThemeProvider,
} from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colorScheme, vars } from 'nativewind';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { brand, defaultTheme, type ThemeName, themes, themeVars } from '@/shared/config/tokens';
import { storage } from '@/shared/lib/storage';

const THEME_KEY = 'nok.theme';

const readTheme = (): ThemeName => {
  const saved = storage.get(THEME_KEY);
  return saved === 'dark' || saved === 'light' ? saved : defaultTheme;
};

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

// Тема навигатора из токенов — иначе React Navigation рисует свой фон поверх canvas
const navigationThemes: Record<ThemeName, NavigationTheme> = {
  dark: {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: brand['brand-red'],
      background: themes.dark.canvas,
      card: themes.dark.panel,
      text: themes.dark.text,
      border: themes.dark.surface,
      notification: themes.dark.danger,
    },
  },
  light: {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: brand['brand-red'],
      background: themes.light.canvas,
      card: themes.light.panel,
      text: themes.light.text,
      border: themes.light.surface,
      notification: themes.light.danger,
    },
  },
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>(readTheme);

  useEffect(() => {
    // включает вариант dark: в классах NativeWind
    colorScheme.set(theme);
    storage.set(THEME_KEY, theme);
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
        <NavigationThemeProvider value={navigationThemes[theme]}>
          <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
          {children}
        </NavigationThemeProvider>
      </View>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
