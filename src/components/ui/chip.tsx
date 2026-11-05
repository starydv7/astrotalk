import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/ui/text';
import { useAppTheme } from '@/theme/theme-provider';

type ChipProps = {
  label: string;
  active?: boolean;
  onPress?: () => void;
  /** Receives the label colour so the icon matches the chip state. */
  leading?: (color: string) => ReactNode;
};

export function Chip({ label, active = false, onPress, leading }: ChipProps) {
  const theme = useAppTheme();
  const color = active ? '#1A140C' : theme.colors.textSecondary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: active ? theme.colors.accentGold : theme.colors.surfaceAlt,
          borderColor: active ? theme.colors.accentGold : theme.colors.border,
        },
        pressed ? { opacity: 0.85 } : null,
      ]}>
      {leading?.(color)}
      <Text variant="caption" style={{ color }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
});
