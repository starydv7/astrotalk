import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { Text } from '@/components/ui/text';
import { useAppTheme } from '@/theme/theme-provider';

type InputProps = TextInputProps & {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  secure?: boolean;
};

export function Input({ label, icon, error, secure, style, ...rest }: InputProps) {
  const theme = useAppTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!secure);

  const borderColor = error
    ? theme.colors.danger
    : focused
      ? theme.colors.primary
      : theme.colors.border;

  return (
    <View style={styles.wrap}>
      {label ? (
        <Text variant="caption" color="textSecondary" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.field,
          {
            backgroundColor: theme.colors.surfaceAlt,
            borderColor,
            borderRadius: theme.radius.lg,
          },
        ]}>
        {icon ? <Ionicons name={icon} size={18} color={theme.colors.textMuted} /> : null}
        <TextInput
          style={[styles.input, { color: theme.colors.text }, style]}
          placeholderTextColor={theme.colors.textMuted}
          secureTextEntry={hidden}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCapitalize="none"
          {...rest}
        />
        {secure ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={8} accessibilityRole="button">
            <Ionicons
              name={hidden ? 'eye-off' : 'eye'}
              size={18}
              color={theme.colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text variant="small" color="danger" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { marginLeft: 4 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 1,
  },
  input: { flex: 1, fontSize: 15, padding: 0 },
  error: { marginLeft: 4 },
});
