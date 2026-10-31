import { StyleSheet, View } from 'react-native';

import { BackButton } from '@/components/ui/back-button';
import { Text } from '@/components/ui/text';

type SubHeaderProps = {
  title: string;
  right?: React.ReactNode;
};

export function SubHeader({ title, right }: SubHeaderProps) {
  return (
    <View style={styles.row}>
      <BackButton />
      <Text variant="h3" numberOfLines={1} style={styles.title}>
        {title}
      </Text>
      <View style={styles.right}>{right ?? <View style={{ width: 40 }} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 12,
  },
  title: { flex: 1 },
  right: { alignItems: 'flex-end' },
});
