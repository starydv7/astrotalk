import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

const ZODIAC: (keyof typeof MaterialCommunityIcons.glyphMap)[] = [
  'zodiac-aries',
  'zodiac-taurus',
  'zodiac-gemini',
  'zodiac-cancer',
  'zodiac-leo',
  'zodiac-virgo',
  'zodiac-libra',
  'zodiac-scorpio',
  'zodiac-sagittarius',
  'zodiac-capricorn',
  'zodiac-aquarius',
  'zodiac-pisces',
];

/** Planet abbreviations placed in North-Indian houses, as fractions of the chart side. */
const GRAHAS: { label: string; x: number; y: number }[] = [
  { label: 'Su', x: 0.5, y: 0.25 },
  { label: 'Me', x: 0.25, y: 0.12 },
  { label: 'Mo', x: 0.25, y: 0.5 },
  { label: 'Ma', x: 0.12, y: 0.75 },
  { label: 'Ju', x: 0.5, y: 0.75 },
  { label: 'Ve', x: 0.75, y: 0.88 },
  { label: 'Sa', x: 0.75, y: 0.5 },
  { label: 'Ra', x: 0.88, y: 0.25 },
  { label: 'Ke', x: 0.12, y: 0.25 },
];

const STARS: { x: number; y: number; size: number; phase: 0 | 1 }[] = [
  { x: 0.04, y: 0.12, size: 3, phase: 0 },
  { x: 0.92, y: 0.06, size: 2, phase: 1 },
  { x: 0.98, y: 0.56, size: 3, phase: 0 },
  { x: 0.08, y: 0.9, size: 2, phase: 1 },
  { x: 0.6, y: 0.98, size: 2.5, phase: 0 },
  { x: 0.22, y: 0.02, size: 2, phase: 1 },
  { x: 0.02, y: 0.5, size: 2, phase: 1 },
];

/** One full cycle of the master clock; every layer turns a whole number of times per cycle. */
const CYCLE_MS = 120_000;

type KundliOrbitProps = { size?: number };

/** Revolving zodiac wheel with a North-Indian kundli, orbiting grahas and a breathing glow. */
export function KundliOrbit({ size = 300 }: KundliOrbitProps) {
  const clock = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    clock.value = withRepeat(withTiming(1, { duration: CYCLE_MS, easing: Easing.linear }), -1, false);
    pulse.value = withRepeat(withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => {
      cancelAnimation(clock);
      cancelAnimation(pulse);
    };
  }, [clock, pulse]);

  const c = size / 2;
  const outer = c - 6;
  const band = 30;
  const inner = outer - band;
  const chart = inner * 1.3;
  const diag = chart * Math.SQRT2;
  const orbitR = inner - 6;

  const zodiacStyle = useSpin(clock, 1);
  const kundliStyle = useSpin(clock, -2);
  const sunStyle = useSpin(clock, 8);
  const moonStyle = useSpin(clock, -5);
  const cometStyle = useSpin(clock, 15);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.45 + pulse.value * 0.55,
    transform: [{ scale: 0.9 + pulse.value * 0.16 }],
  }));
  const twinkleA = useAnimatedStyle(() => ({ opacity: 0.25 + pulse.value * 0.75 }));
  const twinkleB = useAnimatedStyle(() => ({ opacity: 1 - pulse.value * 0.75 }));

  const centered = (w: number, h: number) => ({
    position: 'absolute' as const,
    left: c - w / 2,
    top: c - h / 2,
    width: w,
    height: h,
  });

  return (
    <View pointerEvents="none" style={{ width: size, height: size }}>
      {STARS.map((s, i) => (
        <Animated.View
          key={i}
          style={[
            styles.star,
            {
              left: s.x * size,
              top: s.y * size,
              width: s.size,
              height: s.size,
              borderRadius: s.size,
            },
            s.phase === 0 ? twinkleA : twinkleB,
          ]}
        />
      ))}

      <Animated.View
        style={[centered(inner * 1.7, inner * 1.7), styles.glow, { borderRadius: inner }, glowStyle]}
      />

      {/* Zodiac band */}
      <Animated.View style={[StyleSheet.absoluteFill, zodiacStyle]}>
        <View style={[centered(outer * 2, outer * 2), styles.ringOuter, { borderRadius: outer }]} />
        <View style={[centered(inner * 2, inner * 2), styles.ringInner, { borderRadius: inner }]} />
        {ZODIAC.map((g, i) => (
          <View
            key={g}
            style={[
              centered(18, 18),
              styles.center,
              { transform: [{ rotate: `${i * 30}deg` }, { translateY: -(outer - band / 2) }] },
            ]}>
            <MaterialCommunityIcons name={g} size={14} color="#E8C47A" />
          </View>
        ))}
        {ZODIAC.map((g, i) => (
          <View
            key={`tick-${g}`}
            style={[
              centered(1, band),
              styles.tick,
              { transform: [{ rotate: `${i * 30 + 15}deg` }, { translateY: -(outer - band / 2) }] },
            ]}
          />
        ))}
      </Animated.View>

      {/* Comet riding the outer rim */}
      <Animated.View style={[StyleSheet.absoluteFill, cometStyle]}>
        {[0, 1, 2, 3, 4].map((k) => (
          <View
            key={k}
            style={[
              centered(6 - k, 6 - k),
              styles.comet,
              {
                opacity: 1 - k * 0.2,
                transform: [{ rotate: `${-k * 3}deg` }, { translateY: -outer }],
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* North-Indian kundli */}
      <Animated.View style={[StyleSheet.absoluteFill, kundliStyle]}>
        <View style={[centered(chart, chart), styles.chart]}>
          <View style={[styles.line, { width: diag, left: (chart - diag) / 2, transform: [{ rotate: '45deg' }] }]} />
          <View style={[styles.line, { width: diag, left: (chart - diag) / 2, transform: [{ rotate: '-45deg' }] }]} />
          <View
            style={[
              styles.diamond,
              {
                width: chart / Math.SQRT2,
                height: chart / Math.SQRT2,
                left: (chart - chart / Math.SQRT2) / 2,
                top: (chart - chart / Math.SQRT2) / 2,
              },
            ]}
          />
          {GRAHAS.map((g) => (
            <Text
              key={g.label}
              style={[styles.graha, { left: g.x * chart - 10, top: g.y * chart - 7 }]}>
              {g.label}
            </Text>
          ))}
        </View>
      </Animated.View>

      {/* Orbiting sun and moon */}
      <Animated.View style={[StyleSheet.absoluteFill, sunStyle]}>
        <View style={[centered(16, 16), styles.center, { transform: [{ translateY: -orbitR }] }]}>
          <View style={styles.sunHalo} />
          <View style={styles.sun} />
        </View>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, moonStyle]}>
        <View style={[centered(14, 14), styles.center, { transform: [{ translateY: orbitR }] }]}>
          <MaterialCommunityIcons name="moon-waxing-crescent" size={14} color="#D9D4FF" />
        </View>
      </Animated.View>

      <View style={[centered(34, 34), styles.center, styles.core]}>
        <MaterialCommunityIcons name="white-balance-sunny" size={18} color="#E8C47A" />
      </View>
    </View>
  );
}

function useSpin(clock: SharedValue<number>, turns: number) {
  return useAnimatedStyle(() => ({
    transform: [{ rotate: `${clock.value * turns * 360}deg` }],
  }));
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  star: { position: 'absolute', backgroundColor: '#F6E7C1' },
  glow: { backgroundColor: 'rgba(232,196,122,0.10)', borderWidth: 1, borderColor: 'rgba(232,196,122,0.12)' },
  ringOuter: { borderWidth: 1.2, borderColor: 'rgba(232,196,122,0.55)' },
  ringInner: { borderWidth: 1, borderColor: 'rgba(232,196,122,0.30)' },
  tick: { backgroundColor: 'rgba(232,196,122,0.28)' },
  comet: { borderRadius: 6, backgroundColor: '#F6E7C1' },
  chart: { borderWidth: 1.2, borderColor: 'rgba(232,196,122,0.75)', backgroundColor: 'rgba(20,14,44,0.35)' },
  line: { position: 'absolute', top: '50%', height: 1, backgroundColor: 'rgba(232,196,122,0.55)' },
  diamond: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(232,196,122,0.55)',
    transform: [{ rotate: '45deg' }],
  },
  graha: {
    position: 'absolute',
    width: 20,
    textAlign: 'center',
    fontSize: 9,
    fontWeight: '700',
    color: '#F6E7C1',
    opacity: 0.85,
  },
  sunHalo: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,196,90,0.35)',
  },
  sun: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFC45A' },
  core: {
    borderRadius: 17,
    backgroundColor: '#140E2C',
    borderWidth: 1,
    borderColor: 'rgba(232,196,122,0.8)',
  },
});
