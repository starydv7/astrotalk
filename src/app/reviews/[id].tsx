import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/ui/back-button';
import { Chip } from '@/components/ui/chip';
import { StarRow } from '@/components/ui/rating';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { getAstrologer, RATING_BREAKDOWN, REVIEWS } from '@/data/astrologers';
import { useAppTheme } from '@/theme/theme-provider';

type ReviewFilter = 'all' | 'positive' | 'critical';

export default function ReviewsScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const astrologer = getAstrologer(String(id));
  const [filter, setFilter] = useState<ReviewFilter>('all');

  const data = useMemo(
    () => REVIEWS.filter((r) => (filter === 'all' ? true : r.sentiment === filter)),
    [filter],
  );

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <BackButton />
        <Text variant="h3">Reviews & Ratings</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={data}
        keyExtractor={(r) => r.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.summary}>
            <View style={styles.scoreBlock}>
              <Text variant="display" color="accentGold">
                {astrologer?.rating.toFixed(1) ?? '4.8'}
              </Text>
              <StarRow value={astrologer?.rating ?? 5} size={16} />
              <Text variant="small" color="textMuted">
                {(astrologer?.reviewCount ?? 2300).toLocaleString()} reviews
              </Text>
            </View>
            <View style={styles.breakdown}>
              {RATING_BREAKDOWN.map((b) => (
                <View key={b.stars} style={styles.breakdownRow}>
                  <Text variant="small" color="textMuted" style={styles.starLabel}>
                    {b.stars}
                  </Text>
                  <View style={[styles.track, { backgroundColor: theme.colors.surfaceAlt }]}>
                    <View
                      style={[
                        styles.fill,
                        { width: `${b.percent}%`, backgroundColor: theme.colors.accentGold },
                      ]}
                    />
                  </View>
                  <Text variant="small" color="textMuted" style={styles.percentLabel}>
                    {b.percent}%
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.filters}>
              {(['all', 'positive', 'critical'] as ReviewFilter[]).map((f) => (
                <Chip
                  key={f}
                  label={f[0].toUpperCase() + f.slice(1)}
                  active={filter === f}
                  onPress={() => setFilter(f)}
                />
              ))}
            </View>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.cardHead}>
              <Text variant="bodyStrong">{item.author}</Text>
              <Text variant="small" color="textMuted">
                {item.timeAgo}
              </Text>
            </View>
            <StarRow value={item.rating} size={14} />
            <Text variant="caption" color="textSecondary">
              {item.text}
            </Text>
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  list: { paddingHorizontal: 20, paddingTop: 16 },
  summary: { gap: 20, marginBottom: 20 },
  scoreBlock: { alignItems: 'center', gap: 6 },
  breakdown: { gap: 8 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  starLabel: { width: 12 },
  track: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  percentLabel: { width: 36, textAlign: 'right' },
  filters: { flexDirection: 'row', gap: 8 },
  card: { padding: 14, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, gap: 6 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
