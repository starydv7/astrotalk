import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useAppTheme } from '@/theme/theme-provider';

type LogoProps = {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
};

const marks = {
  sm: { badge: 28, icon: 16, text: 'h3' as const },
  md: { badge: 36, icon: 20, text: 'h2' as const },
  lg: { badge: 48, icon: 26, text: 'h1' as const },
};

export function Logo({ size = 'md', showWordmark = true }: LogoProps) {
  const theme = useAppTheme();
  const m = marks[size];

  return (
    <View style={styles.row}>
      <LinearGradient
        colors={theme.gradients.gold}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.badge, { width: m.badge, height: m.badge, borderRadius: m.badge / 2 }]}>
        <Ionicons name="sparkles" size={m.icon} color="#1A1206" />
      </LinearGradient>
      {showWordmark ? (
        <Text variant={m.text}>
          Astro<Text variant={m.text} color="accentGold">Talk</Text>
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: { alignItems: 'center', justifyContent: 'center' },
});
