import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { Text } from '@/components/ui/text';
import { useAppTheme } from '@/theme/theme-provider';

type BadgeTone = 'gold' | 'violet' | 'success' | 'muted' | 'danger';

type BadgeProps = {
  label: string;
  tone?: BadgeTone;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
};

export function Badge({ label, tone = 'violet', icon, style }: BadgeProps) {
  const theme = useAppTheme();

  const map: Record<BadgeTone, { bg: string; fg: string }> = {
    gold: { bg: theme.colors.accentGoldSoft, fg: theme.colors.accentGold },
    violet: { bg: theme.colors.primarySoft, fg: theme.colors.primary },
    success: { bg: 'rgba(52, 199, 123, 0.16)', fg: theme.colors.success },
    danger: { bg: 'rgba(245, 69, 92, 0.16)', fg: theme.colors.danger },
    muted: { bg: theme.colors.surfaceAlt, fg: theme.colors.textMuted },
  };
  const c = map[tone];

  return (
    <View style={[styles.base, { backgroundColor: c.bg }, style]}>
      {icon ? <Ionicons name={icon} size={12} color={c.fg} /> : null}
      <Text variant="tiny" style={{ color: c.fg }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
});
