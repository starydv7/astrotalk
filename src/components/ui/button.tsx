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

const heights: Record<ButtonSize, number> = { sm: 40, md: 48, lg: 56 };

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
  const textColor =
    variant === 'gold'
      ? theme.colors.textOnAccent
      : variant === 'primary' || variant === 'danger'
        ? '#FFFFFF'
        : variant === 'secondary'
          ? theme.colors.text
          : theme.colors.primary;

  const content = (
    <View style={styles.row}>
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={textColor} /> : null}
          <Text variant={size === 'lg' ? 'title' : 'bodyStrong'} style={{ color: textColor }}>
            {label}
          </Text>
          {iconRight ? <Ionicons name={iconRight} size={18} color={textColor} /> : null}
        </>
      )}
    </View>
  );

  const shellStyle: ViewStyle = {
    height,
    borderRadius: theme.radius.pill,
    opacity: isDisabled ? 0.55 : 1,
    width: fullWidth ? '100%' : undefined,
  };

  if (variant === 'gold' || variant === 'primary') {
    const colors = variant === 'gold' ? theme.gradients.gold : theme.gradients.violet;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled }}
        disabled={isDisabled}
        onPress={onPress}
        style={({ pressed }) => [shellStyle, pressed && !isDisabled ? styles.pressed : null, style]}>
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.fill, { borderRadius: theme.radius.pill }]}>
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  const solid: ViewStyle =
    variant === 'secondary'
      ? { backgroundColor: theme.colors.surfaceAlt, borderWidth: 1, borderColor: theme.colors.border }
      : variant === 'danger'
        ? { backgroundColor: theme.colors.danger }
        : { backgroundColor: 'transparent' };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        shellStyle,
        styles.fill,
        solid,
        pressed && !isDisabled ? styles.pressed : null,
        style,
      ]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});
