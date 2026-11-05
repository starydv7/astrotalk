import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useAppTheme } from '@/theme/theme-provider';

type FormNoticeProps = {
  message: string;
  tone?: 'error' | 'info';
};

export function FormNotice({ message, tone = 'error' }: FormNoticeProps) {
  const theme = useAppTheme();
  const color = tone === 'error' ? theme.colors.danger : theme.colors.accentGold;

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.box,
        {
          borderColor: tone === 'error' ? 'rgba(245, 69, 92, 0.4)' : theme.colors.borderStrong,
          backgroundColor: tone === 'error' ? 'rgba(245, 69, 92, 0.1)' : theme.colors.accentGoldSoft,
        },
      ]}>
      <Ionicons name={tone === 'error' ? 'alert-circle' : 'information-circle'} size={18} color={color} />
      <Text variant="caption" style={[styles.text, { color: theme.colors.text }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  text: { flex: 1 },
});
