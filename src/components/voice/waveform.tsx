import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useAppTheme } from '@/theme/theme-provider';

type WaveformProps = {
  active: boolean;
  bars?: number;
  color?: string;
};

export function Waveform({ active, bars = 32, color }: WaveformProps) {
  const theme = useAppTheme();
  const tint = color ?? theme.colors.accentGold;

  return (
    <View style={styles.row}>
      {Array.from({ length: bars }).map((_, i) => (
        <Bar key={i} index={i} active={active} color={tint} />
      ))}
    </View>
  );
}

function Bar({ index, active, color }: { index: number; active: boolean; color: string }) {
  const height = useSharedValue(8);

  useEffect(() => {
    if (active) {
      const peak = 14 + ((index * 7) % 40);
      height.value = withRepeat(
        withTiming(peak, { duration: 320 + ((index * 37) % 260) }),
        -1,
        true,
      );
    } else {
      height.value = withTiming(6, { duration: 200 });
    }
  }, [active, height, index]);

  const style = useAnimatedStyle(() => ({ height: height.value }));

  return <Animated.View style={[styles.bar, { backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 60 },
  bar: { width: 3, borderRadius: 3 },
});
