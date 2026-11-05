import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';

type LogoProps = {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
};

const marks = {
  sm: { badge: 36, text: 'h3' as const },
  md: { badge: 44, text: 'h2' as const },
  lg: { badge: 64, text: 'h1' as const },
};

export function Logo({ size = 'md', showWordmark = true }: LogoProps) {
  const m = marks[size];

  return (
    <View style={styles.row}>
      <View style={[styles.ring, { borderRadius: m.badge }]}>
        <Image
          source={require('../../../assets/images/icon.png')}
          style={{ width: m.badge, height: m.badge, borderRadius: m.badge / 2 }}
          contentFit="cover"
          accessibilityLabel="AstroTalk"
        />
      </View>
      {showWordmark ? (
        <Text variant={m.text} style={styles.word}>
          Astro<Text variant={m.text} color="accentGold">Talk</Text>
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ring: {
    borderWidth: 1,
    borderColor: 'rgba(232, 196, 122, 0.55)',
    padding: 1,
  },
  word: { letterSpacing: -0.4 },
});
