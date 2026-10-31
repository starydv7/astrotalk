import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TextInput, View, type ViewStyle } from 'react-native';

import { useAppTheme } from '@/theme/theme-provider';

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: ViewStyle;
  onSubmitEditing?: () => void;
};

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search astrologers, topics...',
  style,
  onSubmitEditing,
}: SearchBarProps) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: theme.colors.surfaceAlt,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.pill,
        },
        style,
      ]}>
      <Ionicons name="search" size={18} color={theme.colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        style={[styles.input, { color: theme.colors.text }]}
        returnKeyType="search"
        onSubmitEditing={onSubmitEditing}
        autoCorrect={false}
        clearButtonMode="while-editing"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: StyleSheet.hairlineWidth,
  },
  input: { flex: 1, fontSize: 15, padding: 0 },
});
