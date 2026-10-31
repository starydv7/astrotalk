import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useAppTheme } from '@/theme/theme-provider';
import type { TypographyVariant } from '@/theme/tokens';

type ColorKey =
  | 'text'
  | 'textSecondary'
  | 'textMuted'
  | 'textInverse'
  | 'textOnAccent'
  | 'primary'
  | 'accentGold'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

export type AppTextProps = RNTextProps & {
  variant?: TypographyVariant;
  color?: ColorKey;
  weight?: '400' | '500' | '600' | '700' | '800';
  center?: boolean;
};

export function Text({
  variant = 'body',
  color = 'text',
  weight,
  center,
  style,
  ...rest
}: AppTextProps) {
  const theme = useAppTheme();
  return (
    <RNText
      style={[
        theme.typography[variant],
        { color: theme.colors[color] },
        weight ? { fontWeight: weight } : null,
        center ? { textAlign: 'center' } : null,
        style,
      ]}
      {...rest}
    />
  );
}
