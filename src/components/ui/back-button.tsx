import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { useAppTheme } from '@/theme/theme-provider';

type BackButtonProps = {
  onPress?: () => void;
  tint?: string;
};

export function BackButton({ onPress, tint }: BackButtonProps) {
  const theme = useAppTheme();
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={8}
      onPress={onPress ?? (() => (router.canGoBack() ? router.back() : router.replace('/(tabs)')))}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: theme.colors.surfaceAlt,
          borderColor: theme.colors.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}>
      <Ionicons name="chevron-back" size={22} color={tint ?? theme.colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
