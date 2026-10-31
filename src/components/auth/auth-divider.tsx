import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useAppTheme } from '@/theme/theme-provider';

export function AuthDivider({ label }: { label: string }) {
  const theme = useAppTheme();
  return (
    <View style={styles.row}>
      <View style={[styles.line, { backgroundColor: theme.colors.border }]} />
      <Text variant="small" color="textMuted">
        {label}
      </Text>
      <View style={[styles.line, { backgroundColor: theme.colors.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
});
