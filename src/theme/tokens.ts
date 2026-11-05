/**
 * Astro Talk design tokens.
 *
 * The product uses a premium dark astrology aesthetic: deep midnight navy
 * backgrounds, warm violet/lavender accents, and soft gold for astrology
 * highlights. These tokens are the single source of truth for color, spacing,
 * radius, typography, shadow, and motion so every screen stays consistent.
 */

import { Platform } from 'react-native';

export const palette = {
  // Core brand
  gold: '#E8C47A',
  goldSoft: '#F6E7C1',
  goldDeep: '#C6A15A',

  violet: '#7C5CFF',
  violetSoft: '#A48BFF',
  violetDeep: '#5B3FD6',
  lavender: '#C9BEFF',

  // Midnight / navy surfaces (dark theme)
  navy900: '#07060F',
  navy800: '#100E1C',
  navy700: '#171428',
  navy600: '#221C38',
  navy500: '#2C2648',

  // Neutrals
  white: '#FFFFFF',
  ink: '#0B0C1A',
  slate100: '#F4F5FA',
  slate200: '#E6E8F2',
  slate300: '#CDD1E4',
  slate400: '#9AA0C0',
  slate500: '#6B7196',
  slate600: '#474C73',

  // Status
  success: '#34C77B',
  successSoft: '#1C7A4C',
  warning: '#F5A524',
  danger: '#F5455C',
  info: '#4C9AFF',

  // Utility
  transparent: 'transparent',
  overlay: 'rgba(5, 6, 20, 0.6)',
} as const;

export type ColorScheme = {
  // Backgrounds
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceAlt: string;
  surfaceElevated: string;
  overlay: string;

  // Borders / dividers
  border: string;
  borderStrong: string;

  // Text
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  textOnAccent: string;

  // Accents
  primary: string;
  primarySoft: string;
  accentGold: string;
  accentGoldSoft: string;

  // Status
  success: string;
  warning: string;
  danger: string;
  info: string;

  // Tab bar
  tabActive: string;
  tabInactive: string;
  tabBackground: string;
};

const darkScheme: ColorScheme = {
  background: palette.navy900,
  backgroundAlt: palette.navy800,
  surface: palette.navy800,
  surfaceAlt: palette.navy700,
  surfaceElevated: palette.navy600,
  overlay: palette.overlay,

  border: 'rgba(232, 196, 122, 0.16)',
  borderStrong: 'rgba(232, 196, 122, 0.38)',

  text: palette.white,
  textSecondary: palette.slate300,
  textMuted: palette.slate400,
  textInverse: palette.ink,
  textOnAccent: palette.ink,

  primary: palette.violet,
  primarySoft: 'rgba(124, 92, 255, 0.18)',
  accentGold: palette.gold,
  accentGoldSoft: 'rgba(245, 181, 68, 0.16)',

  success: palette.success,
  warning: palette.warning,
  danger: palette.danger,
  info: palette.info,

  tabActive: palette.gold,
  tabInactive: palette.slate400,
  tabBackground: palette.navy800,
};

const lightScheme: ColorScheme = {
  background: palette.slate100,
  backgroundAlt: palette.white,
  surface: palette.white,
  surfaceAlt: palette.slate100,
  surfaceElevated: palette.white,
  overlay: 'rgba(11, 12, 26, 0.45)',

  border: 'rgba(71, 76, 115, 0.14)',
  borderStrong: 'rgba(71, 76, 115, 0.26)',

  text: palette.ink,
  textSecondary: palette.slate600,
  textMuted: palette.slate500,
  textInverse: palette.white,
  textOnAccent: palette.ink,

  primary: palette.violetDeep,
  primarySoft: 'rgba(124, 92, 255, 0.12)',
  accentGold: palette.goldDeep,
  accentGoldSoft: 'rgba(245, 181, 68, 0.14)',

  success: palette.successSoft,
  warning: palette.warning,
  danger: palette.danger,
  info: palette.info,

  tabActive: palette.violetDeep,
  tabInactive: palette.slate500,
  tabBackground: palette.white,
};

export const schemes = {
  dark: darkScheme,
  light: lightScheme,
} as const;

export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
  giant: 64,
} as const;

export const radius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 999,
} as const;

export const fontFamily = Platform.select({
  ios: {
    regular: 'System',
    rounded: 'ui-rounded',
    serif: 'ui-serif',
    mono: 'ui-monospace',
  },
  android: {
    regular: 'sans-serif',
    rounded: 'sans-serif',
    serif: 'serif',
    mono: 'monospace',
  },
  default: {
    regular: 'System',
    rounded: 'System',
    serif: 'serif',
    mono: 'monospace',
  },
}) as { regular: string; rounded: string; serif: string; mono: string };

export const typography = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '800' as const, letterSpacing: -0.8 },
  h1: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const, letterSpacing: -0.5 },
  h2: { fontSize: 22, lineHeight: 28, fontWeight: '700' as const },
  h3: { fontSize: 18, lineHeight: 24, fontWeight: '700' as const },
  title: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '600' as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' as const },
  small: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
  tiny: { fontSize: 11, lineHeight: 14, fontWeight: '600' as const },
} as const;

export type TypographyVariant = keyof typeof typography;

export const shadow = {
  none: {
    shadowColor: palette.transparent,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  sm: {
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  md: {
    shadowColor: '#000000',
    shadowOpacity: 0.24,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  glow: {
    shadowColor: palette.gold,
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
} as const;

export const motion = {
  fast: 150,
  base: 250,
  slow: 400,
} as const;

/** Gradient presets used across hero sections and accent surfaces. */
export const gradients = {
  night: ['#07060F', '#140E2C', '#241447'] as const,
  violet: ['#8B6CFF', '#5B3FD6'] as const,
  gold: ['#F6E7C1', '#E8C47A', '#C6A15A'] as const,
  hero: ['rgba(7,6,15,0)', 'rgba(7,6,15,0.55)', 'rgba(7,6,15,0.98)'] as const,
  premium: ['#2A1B4A', '#6E4BFF', '#E8C47A'] as const,
};
