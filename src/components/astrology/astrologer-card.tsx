import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Rating } from '@/components/ui/rating';
import { Text } from '@/components/ui/text';
import { useAppTheme } from '@/theme/theme-provider';
import type { Astrologer } from '@/types/domain';
import { formatCurrency } from '@/utils/validation';

type AstrologerCardProps = {
  astrologer: Astrologer;
  onPress: () => void;
  layout?: 'row' | 'tile';
};

export function AstrologerCard({ astrologer, onPress, layout = 'row' }: AstrologerCardProps) {
  const theme = useAppTheme();
  const [fav, setFav] = useState(false);

  if (layout === 'tile') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={astrologer.name}
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
        <Avatar uri={astrologer.avatarUrl} name={astrologer.name} size={64} online={astrologer.online} />
        <Text variant="bodyStrong" numberOfLines={1} style={styles.tileName}>
          {astrologer.name}
        </Text>
        <Text variant="small" color="textMuted" numberOfLines={1}>
          {astrologer.specialty}
        </Text>
        <Rating value={astrologer.rating} size={12} showValue />
        <Text variant="caption" color="accentGold" weight="700">
          {formatCurrency(astrologer.pricePerMinute)}/min
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={astrologer.name}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.xl,
        },
        pressed ? styles.pressed : null,
      ]}>
      <Avatar uri={astrologer.avatarUrl} name={astrologer.name} size={56} online={astrologer.online} />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {astrologer.name}
          </Text>
          {astrologer.verified ? (
            <Ionicons name="checkmark-circle" size={14} color={theme.colors.info} />
          ) : null}
        </View>
        <Text variant="small" color="textMuted" numberOfLines={1}>
          {astrologer.specialty}
        </Text>
        <View style={styles.metaRow}>
          <Rating value={astrologer.rating} reviews={astrologer.reviewCount} size={12} />
        </View>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: astrologer.online ? theme.colors.success : theme.colors.textMuted },
            ]}
          />
          <Text variant="small" color={astrologer.online ? 'success' : 'textMuted'}>
            {astrologer.online ? 'Online' : 'Offline'}
          </Text>
        </View>
      </View>

      <View style={styles.right}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={fav ? 'Remove from favorites' : 'Add to favorites'}
          onPress={() => setFav((f) => !f)}
          hitSlop={8}>
          <Ionicons
            name={fav ? 'heart' : 'heart-outline'}
            size={20}
            color={fav ? theme.colors.danger : theme.colors.textMuted}
          />
        </Pressable>
        <View style={[styles.pricePill, { backgroundColor: theme.colors.accentGoldSoft }]}>
          <Text variant="caption" color="accentGold" weight="700">
            {formatCurrency(astrologer.pricePerMinute)}/min
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  info: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  right: { alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, height: 56 },
  pricePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  tile: {
    width: 150,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tileName: { marginTop: 8 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
});
