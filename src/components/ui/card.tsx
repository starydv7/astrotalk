import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { useAppTheme } from '@/theme/theme-provider';

type CardProps = {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padded?: boolean;
  elevated?: boolean;
  tone?: 'surface' | 'surfaceAlt' | 'elevated';
  accessibilityLabel?: string;
};

export function Card({
  children,
  onPress,
  style,
  padded = true,
  elevated = false,
  tone = 'surface',
  accessibilityLabel,
}: CardProps) {
  const theme = useAppTheme();

  const bg =
    tone === 'surface'
      ? theme.colors.surface
      : tone === 'surfaceAlt'
        ? theme.colors.surfaceAlt
        : theme.colors.surfaceElevated;

  const baseStyle: ViewStyle = {
    backgroundColor: bg,
    borderRadius: theme.radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    padding: padded ? theme.spacing.lg : 0,
    ...(elevated ? theme.shadow.md : null),
  };

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => [baseStyle, pressed ? styles.pressed : null, style]}>
        {children}
      </Pressable>
    );
  }

  return <View style={[baseStyle, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
});
