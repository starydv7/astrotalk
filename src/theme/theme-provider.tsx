import { createContext, useContext, useMemo, type ReactNode } from 'react';

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
  const mode = 'dark' as const;

  const value = useMemo<AppTheme>(
    () => ({
      mode,
      colors: schemes.dark,
      spacing,
      radius,
      typography,
      shadow,
      motion,
      gradients,
    }),
    [],
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
