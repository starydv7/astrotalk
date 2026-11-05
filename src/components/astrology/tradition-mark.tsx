import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import type { Tradition } from '@/types/domain';

type Glyph = keyof typeof MaterialCommunityIcons.glyphMap;

const TRADITIONS: Record<Tradition, { icon: Glyph; label: string; color: string }> = {
  vedic: { icon: 'om', label: 'Vedic', color: '#E8C47A' },
  islamic: { icon: 'star-crescent', label: 'Islamic', color: '#7FE0C4' },
};

/**
 * Religious symbols belong only next to tradition-specific content. Anything
 * without a known tradition gets no symbol at all.
 */
export function traditionInfo(tradition?: string | null) {
  return tradition && tradition in TRADITIONS ? TRADITIONS[tradition as Tradition] : undefined;
}

type TraditionMarkProps = {
  tradition?: string | null;
  size?: number;
  color?: string;
};

export function TraditionMark({ tradition, size = 14, color }: TraditionMarkProps) {
  const info = traditionInfo(tradition);
  if (!info) return null;
  return (
    <MaterialCommunityIcons
      name={info.icon}
      size={size}
      color={color ?? info.color}
      accessibilityLabel={`${info.label} tradition`}
    />
  );
}

type TraditionBadgeProps = { tradition?: string | null; compact?: boolean };

export function TraditionBadge({ tradition, compact }: TraditionBadgeProps) {
  const info = traditionInfo(tradition);
  if (!info) return null;
  return (
    <View
      style={[styles.badge, { borderColor: `${info.color}55`, backgroundColor: `${info.color}14` }]}
      accessibilityLabel={`${info.label} tradition`}>
      <MaterialCommunityIcons name={info.icon} size={compact ? 11 : 13} color={info.color} />
      <Text style={[styles.label, compact && styles.labelCompact, { color: info.color }]}>
        {info.label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4 },
  labelCompact: { fontSize: 9, letterSpacing: 1.2 },
});
