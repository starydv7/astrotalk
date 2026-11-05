import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Text } from '@/components/ui/text';

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
};

export function PageHeader({ eyebrow, title, subtitle, right }: PageHeaderProps) {
  return (
    <Animated.View entering={FadeInDown.duration(520).springify().damping(18)} style={styles.wrap}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <View style={styles.row}>
        <Text variant="h1" style={styles.title}>
          {title}
        </Text>
        {right}
      </View>
      {subtitle ? (
        <Text variant="caption" color="textMuted">
          {subtitle}
        </Text>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20, paddingTop: 8, gap: 4 },
  eyebrow: {
    color: '#E8C47A',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 2.4,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  title: { flex: 1, letterSpacing: -0.6 },
});
