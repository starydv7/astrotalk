import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useAppTheme } from '@/theme/theme-provider';

type RatingProps = {
  value: number;
  reviews?: number;
  size?: number;
  showValue?: boolean;
};

export function Rating({ value, reviews, size = 14, showValue = true }: RatingProps) {
  const theme = useAppTheme();
  const rounded = Math.round(value * 2) / 2;

  return (
    <View style={styles.row}>
      <Ionicons name="star" size={size} color={theme.colors.accentGold} />
      {showValue ? (
        <Text variant="caption" weight="700">
          {value.toFixed(1)}
        </Text>
      ) : null}
      {reviews !== undefined ? (
        <Text variant="caption" color="textMuted">
          ({formatCount(reviews)} reviews)
        </Text>
      ) : null}
      {/* rounded kept for potential half-star rendering */}
      {rounded < 0 ? null : null}
    </View>
  );
}

export function StarRow({ value, size = 16 }: { value: number; size?: number }) {
  const theme = useAppTheme();
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= Math.round(value) ? 'star' : 'star-outline'}
          size={size}
          color={theme.colors.accentGold}
        />
      ))}
    </View>
  );
}

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
