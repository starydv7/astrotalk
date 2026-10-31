import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Switch, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useAppTheme } from '@/theme/theme-provider';

type ToggleRowProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

export function ToggleRow({ icon, label, description, value, onValueChange }: ToggleRowProps) {
  const theme = useAppTheme();
  return (
    <View style={styles.row}>
      {icon ? (
        <View style={[styles.icon, { backgroundColor: theme.colors.surfaceAlt }]}>
          <Ionicons name={icon} size={18} color={theme.colors.textSecondary} />
        </View>
      ) : null}
      <View style={styles.text}>
        <Text variant="body">{label}</Text>
        {description ? (
          <Text variant="small" color="textMuted">
            {description}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: theme.colors.primary, false: theme.colors.surfaceElevated }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16 },
  icon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
});
