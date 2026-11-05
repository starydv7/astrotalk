import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Text } from '@/components/ui/text';
import { useAppTheme } from '@/theme/theme-provider';
import { tap } from '@/utils/haptics';

type ButtonVariant = 'primary' | 'gold' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof Ionicons.glyphMap;
  iconRight?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

const heights: Record<ButtonSize, number> = { sm: 44, md: 52, lg: 58 };
const paddings: Record<ButtonSize, number> = { sm: 18, md: 24, lg: 28 };

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
}: ButtonProps) {
  const theme = useAppTheme();
  const isDisabled = disabled || loading;
  const height = heights[size];
  const radius = height / 2;

  const textColor =
    variant === 'gold'
      ? '#1A140C'
      : variant === 'primary' || variant === 'danger'
        ? '#FFFFFF'
        : variant === 'secondary'
          ? theme.colors.text
          : theme.colors.accentGold;

  const gradient =
    variant === 'gold'
      ? (['#F6E7C1', '#E8C47A', '#C6A15A'] as const)
      : variant === 'primary'
        ? (['#7B5CFF', '#5B3FD9', '#3F2AA8'] as const)
        : variant === 'danger'
          ? (['#FF7A7A', '#E5484D', '#B8323A'] as const)
          : null;

  const frame: ViewStyle = {
    height,
    minHeight: height,
    borderRadius: radius,
    alignSelf: fullWidth ? 'stretch' : 'auto',
    opacity: isDisabled ? 0.5 : 1,
    overflow: 'hidden',
  };

  const surface: ViewStyle =
    variant === 'secondary'
      ? { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(232,196,122,0.35)' }
      : variant === 'ghost'
        ? { backgroundColor: 'transparent' }
        : { borderWidth: 1, borderColor: variant === 'gold' ? 'rgba(255,244,214,0.7)' : 'rgba(255,255,255,0.18)' };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.shadow,
        variant === 'gold' && !isDisabled ? styles.goldGlow : null,
        { borderRadius: radius, alignSelf: fullWidth ? 'stretch' : 'auto' },
        pressed && !isDisabled ? styles.pressed : null,
        style,
      ]}>
      <View style={[frame, surface]}>
        {gradient ? (
          <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        ) : null}
        {gradient ? (
          <LinearGradient
            colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.6 }}
            style={styles.sheen}
          />
        ) : null}
        <View style={[styles.row, { paddingHorizontal: paddings[size] }]}>
          {loading ? (
            <ActivityIndicator color={textColor} size="small" />
          ) : (
            <>
              {icon ? <Ionicons name={icon} size={size === 'sm' ? 16 : 19} color={textColor} /> : null}
              <Text
                variant={size === 'lg' ? 'title' : 'bodyStrong'}
                numberOfLines={1}
                style={[styles.label, { color: textColor }]}>
                {label}
              </Text>
              {iconRight ? <Ionicons name={iconRight} size={size === 'sm' ? 16 : 19} color={textColor} /> : null}
            </>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  label: { letterSpacing: 0.3, flexShrink: 0 },
  sheen: { position: 'absolute', left: 0, right: 0, top: 0, height: '55%' },
  shadow: { flexShrink: 0 },
  goldGlow: {
    shadowColor: '#E8C47A',
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
});
