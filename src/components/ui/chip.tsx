import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/ui/text';
import { useAppTheme } from '@/theme/theme-provider';

type ChipProps = {
  label: string;
  active?: boolean;
  onPress?: () => void;
};

export function Chip({ label, active = false, onPress }: ChipProps) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: active ? theme.colors.primary : theme.colors.surfaceAlt,
          borderColor: active ? theme.colors.primary : theme.colors.border,
        },
        pressed ? { opacity: 0.85 } : null,
      ]}>
      <Text variant="caption" style={{ color: active ? '#FFFFFF' : theme.colors.textSecondary }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
});
