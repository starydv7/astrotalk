import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import {
  gradients,
  motion,
  radius,
  schemes,
  shadow,
  spacing,
  typography,
  type ColorScheme,
} from '@/theme/tokens';

export type AppTheme = {
  mode: 'light' | 'dark';
  colors: ColorScheme;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  shadow: typeof shadow;
  motion: typeof motion;
  gradients: typeof gradients;
};

const ThemeContext = createContext<AppTheme | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const mode: 'light' | 'dark' = scheme === 'light' ? 'light' : 'dark';

  const value = useMemo<AppTheme>(
    () => ({
      mode,
      colors: schemes[mode],
      spacing,
      radius,
      typography,
      shadow,
      motion,
      gradients,
    }),
    [mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): AppTheme {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useAppTheme must be used within an AppThemeProvider');
  }
  return ctx;
}
