import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const STARS: { top: `${number}%`; left: `${number}%`; size: number; gold?: boolean }[] = [
  { top: '6%', left: '12%', size: 2, gold: true },
  { top: '11%', left: '72%', size: 1.5 },
  { top: '18%', left: '28%', size: 1.5 },
  { top: '22%', left: '88%', size: 2, gold: true },
  { top: '31%', left: '8%', size: 1.5 },
  { top: '36%', left: '54%', size: 1 },
  { top: '44%', left: '81%', size: 2 },
  { top: '52%', left: '18%', size: 1.5, gold: true },
  { top: '61%', left: '66%', size: 1 },
  { top: '68%', left: '36%', size: 2 },
  { top: '74%', left: '90%', size: 1.5, gold: true },
  { top: '82%', left: '14%', size: 1.5 },
  { top: '88%', left: '48%', size: 2 },
  { top: '15%', left: '46%', size: 1 },
  { top: '57%', left: '42%', size: 1.5 },
];

type CosmicBackdropProps = {
  /** Deeper violet wash for welcome, membership, and call-adjacent screens. */
  rich?: boolean;
};

export function CosmicBackdrop({ rich = false }: CosmicBackdropProps) {
  const spin = useSharedValue(0);
  const twinkle = useSharedValue(0.35);

  useEffect(() => {
    spin.value = withRepeat(
      withTiming(360, { duration: 72000, easing: Easing.linear }),
      -1,
      false,
    );
    twinkle.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [spin, twinkle]);

  const ring = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }],
  }));

  const spark = useAnimatedStyle(() => ({
    opacity: twinkle.value,
  }));

  const colors = rich
    ? (['#07060F', '#140E2C', '#241447'] as const)
    : (['#07060F', '#0E0C18', '#161228'] as const);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient colors={colors} style={StyleSheet.absoluteFill} />
      {STARS.map((star, index) => (
        <View
          key={index}
          style={{
            position: 'absolute',
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            borderRadius: star.size,
            backgroundColor: star.gold ? '#E8C47A' : '#F4F1FF',
            opacity: star.gold ? 0.85 : 0.45,
          }}
        />
      ))}
      <Animated.View style={[styles.spark, spark]} />
      <Animated.View style={[styles.orbit, ring]}>
        <View style={styles.orbitDot} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  spark: {
    position: 'absolute',
    top: '27%',
    right: '18%',
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#E8C47A',
  },
  orbit: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 1,
    borderColor: 'rgba(232, 196, 122, 0.16)',
  },
  orbitDot: {
    position: 'absolute',
    top: 18,
    left: 136,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E8C47A',
  },
});
