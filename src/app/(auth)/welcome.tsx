import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CosmicBackdrop } from '@/components/brand/cosmic-backdrop';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useAppTheme } from '@/theme/theme-provider';

export default function WelcomeScreen() {
  const theme = useAppTheme();
  const router = useRouter();

  return (
    <View style={styles.flex}>
      <StatusBar style="light" />
      <CosmicBackdrop rich />
      <SafeAreaView style={styles.flex}>
        <View style={styles.top}>
          <Logo size="md" />
        </View>

        {/* Decorative zodiac ring + meditation silhouette */}
        <View style={styles.hero}>
          <View style={styles.ringOuter}>
            <View style={[styles.ring, { borderColor: 'rgba(245,181,68,0.25)' }]} />
            <View style={[styles.ringInner, { borderColor: 'rgba(164,139,255,0.3)' }]} />
            <LinearGradient
              colors={theme.gradients.violet}
              style={styles.figure}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}>
              <Ionicons name="person" size={64} color="#FFFFFF" />
            </LinearGradient>
            {ZODIAC_DOTS.map((d, i) => (
              <View
                key={i}
                style={[
                  styles.zodiacDot,
                  {
                    transform: [
                      { rotate: `${(360 / ZODIAC_DOTS.length) * i}deg` },
                      { translateY: -128 },
                    ],
                  },
                ]}>
                <Ionicons name={d} size={16} color={theme.colors.accentGold} />
              </View>
            ))}
          </View>
        </View>

        <Animated.View entering={FadeInDown.duration(640).delay(80)} style={styles.bottom}>
          <Text variant="display" center>
            Life&apos;s Questions
          </Text>
          <Text variant="display" color="accentGold" center>
            Find Clear Answers
          </Text>
          <Text variant="body" color="textSecondary" center style={styles.subtitle}>
            Talk to trusted astrologers anytime, anywhere. Get guidance for love, career, finance,
            health and more.
          </Text>

          <Button
            label="Get Started"
            variant="gold"
            size="lg"
            iconRight="arrow-forward"
            style={styles.cta}
            onPress={() => router.push('/(auth)/onboarding')}
          />

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(auth)/login')}
            style={styles.signIn}
            hitSlop={8}>
            <Text variant="caption" color="textSecondary">
              Already have an account?{' '}
            </Text>
            <Text variant="caption" color="accentGold" weight="700">
              Sign In
            </Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const ZODIAC_DOTS: (keyof typeof Ionicons.glyphMap)[] = [
  'star',
  'moon',
  'sunny',
  'sparkles',
  'planet',
  'star-half',
  'star',
  'moon',
  'sunny',
  'sparkles',
  'planet',
  'star-half',
];

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: { alignItems: 'center', paddingTop: 12 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ringOuter: { width: 280, height: 280, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 280, height: 280, borderRadius: 140, borderWidth: 1 },
  ringInner: { position: 'absolute', width: 210, height: 210, borderRadius: 105, borderWidth: 1 },
  figure: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zodiacDot: { position: 'absolute' },
  bottom: { paddingHorizontal: 24, paddingBottom: 12, gap: 6 },
  subtitle: { marginTop: 10, paddingHorizontal: 8 },
  cta: { marginTop: 24 },
  signIn: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
});
