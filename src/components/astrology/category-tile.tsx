import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { CATEGORY_TONES } from '@/theme/category-tone';
import { useAppTheme } from '@/theme/theme-provider';
import type { GuidanceCategory } from '@/types/domain';

type CategoryTileProps = {
  category: GuidanceCategory;
  onPress: () => void;
};

export function CategoryTile({ category, onPress }: CategoryTileProps) {
  const theme = useAppTheme();
  const tone = CATEGORY_TONES[category.tone];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={category.title}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.xl,
        },
        pressed ? styles.pressed : null,
      ]}>
      <View style={[styles.iconWrap, { backgroundColor: tone.bg }]}>
        <Ionicons name={category.icon as keyof typeof Ionicons.glyphMap} size={24} color={tone.fg} />
      </View>
      <Text variant="bodyStrong" numberOfLines={2} style={styles.title}>
        {category.title}
      </Text>
      <Text variant="small" color="textMuted" numberOfLines={2}>
        {category.subtitle}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    padding: 16,
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 150,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  title: { marginTop: 2 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});
