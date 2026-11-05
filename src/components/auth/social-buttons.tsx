import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/ui/text';
import { useAppTheme } from '@/theme/theme-provider';
import { tap } from '@/utils/haptics';

type SocialButtonsProps = {
  onGoogle: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export function SocialButtons({ onGoogle, loading = false, disabled = false }: SocialButtonsProps) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Continue with Google"
      disabled={loading || disabled}
      onPress={() => {
        tap();
        onGoogle();
      }}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: '#F6F3EC',
          borderRadius: theme.radius.pill,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}>
      {loading ? (
        <ActivityIndicator color="#1A140C" />
      ) : (
        <>
          <Ionicons name="logo-google" size={20} color="#EA4335" />
          <Text variant="bodyStrong" style={styles.label}>
            Continue with Google
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 54,
  },
  label: { color: '#1A140C' },
});
