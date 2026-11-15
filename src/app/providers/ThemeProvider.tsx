import {
  DarkTheme,
  DefaultTheme,
  type Theme as NavigationTheme,
  ThemeProvider as NavigationThemeProvider,
} from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colorScheme, vars } from 'nativewind';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme, View } from 'react-native';
import { brand, type ThemeName, themes, themeVars } from '@/shared/config/tokens';
import { storage } from '@/shared/lib/storage';

const THEME_KEY = 'nok.theme';

export type ThemeMode = ThemeName | 'system';

const readMode = (): ThemeMode => {
  const saved = storage.get(THEME_KEY);
  return saved === 'dark' || saved === 'light' ? saved : 'system';
};

type ThemeContextValue = {
  mode: ThemeMode;
  theme: ThemeName;
  setMode: (mode: ThemeMode) => void;
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
  const [mode, setMode] = useState<ThemeMode>(readMode);
  const system: ThemeName = useColorScheme() === 'light' ? 'light' : 'dark';
  const theme = mode === 'system' ? system : mode;

  useEffect(() => {
    // включает вариант dark: в классах NativeWind
    colorScheme.set(theme);
  }, [theme]);

  useEffect(() => {
    storage.set(THEME_KEY, mode);
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      theme,
      setMode,
      setTheme: setMode,
      toggleTheme: () => setMode(theme === 'dark' ? 'light' : 'dark'),
    }),
    [mode, theme],
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
