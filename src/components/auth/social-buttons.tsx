import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useAppTheme } from '@/theme/theme-provider';

type Provider = 'google' | 'facebook';

type SocialButtonsProps = {
  onPress: (provider: Provider) => void;
  loadingProvider?: Provider | null;
};

export function SocialButtons({ onPress, loadingProvider }: SocialButtonsProps) {
  const theme = useAppTheme();

  const items: { provider: Provider; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
    { provider: 'google', label: 'Continue with Google', icon: 'logo-google', color: '#EA4335' },
    { provider: 'facebook', label: 'Continue with Facebook', icon: 'logo-facebook', color: '#1877F2' },
  ];

  return (
    <View style={styles.wrap}>
      {items.map((item) => (
        <Pressable
          key={item.provider}
          accessibilityRole="button"
          accessibilityLabel={item.label}
          disabled={!!loadingProvider}
          onPress={() => onPress(item.provider)}
          style={({ pressed }) => [
            styles.btn,
            {
              backgroundColor: theme.colors.surfaceAlt,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.pill,
              opacity: loadingProvider && loadingProvider !== item.provider ? 0.5 : pressed ? 0.85 : 1,
            },
          ]}>
          <Ionicons name={item.icon} size={20} color={item.color} />
          <Text variant="bodyStrong">
            {loadingProvider === item.provider ? 'Connecting…' : item.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    borderWidth: 1,
  },
});
