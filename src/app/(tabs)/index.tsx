import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Logo } from '@/components/brand/logo';
import { AstrologerCard } from '@/components/astrology/astrologer-card';
import { Screen } from '@/components/ui/screen';
import { SearchBar } from '@/components/ui/search-bar';
import { SectionHeader } from '@/components/ui/section-header';
import { Text } from '@/components/ui/text';
import { ASTROLOGERS } from '@/data/astrologers';
import { HOME_CHIPS } from '@/data/categories';
import { CATEGORY_TONES } from '@/theme/category-tone';
import { useAppTheme } from '@/theme/theme-provider';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const topAstrologers = useMemo(() => ASTROLOGERS.slice(0, 5), []);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Logo size="sm" />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            hitSlop={8}
            style={[styles.iconBtn, { backgroundColor: theme.colors.surfaceAlt }]}>
            <Ionicons name="notifications-outline" size={20} color={theme.colors.text} />
          </Pressable>
        </View>

        <View style={styles.intro}>
          <Text variant="caption" color="textMuted">
            {greeting()},
          </Text>
          <Text variant="h1">Find Clarity</Text>
          <Text variant="h2" color="accentGold">
            For a Better Tomorrow
          </Text>
        </View>

        <View style={styles.searchWrap}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => router.push('/(tabs)/astrologers')}
          />
        </View>

        {/* Category chips */}
        <View style={styles.chipsGrid}>
          {HOME_CHIPS.map((chip) => {
            const tone =
              chip.id === 'more'
                ? { bg: theme.colors.surfaceAlt, fg: theme.colors.textSecondary }
                : CATEGORY_TONES[toneFor(chip.id)];
            return (
              <Pressable
                key={chip.id}
                accessibilityRole="button"
                accessibilityLabel={chip.label}
                onPress={() =>
                  chip.id === 'more'
                    ? router.push('/categories')
                    : router.push('/(tabs)/astrologers')
                }
                style={styles.chip}>
                <View style={[styles.chipIcon, { backgroundColor: tone.bg }]}>
                  <Ionicons name={chip.icon as keyof typeof Ionicons.glyphMap} size={22} color={tone.fg} />
                </View>
                <Text variant="small" color="textSecondary" numberOfLines={1}>
                  {chip.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Promo banner */}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(tabs)/astrologers')}
          style={styles.bannerWrap}>
          <LinearGradient
            colors={theme.gradients.premium}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.banner}>
            <View style={styles.bannerText}>
              <Text variant="h3" style={{ color: '#FFFFFF' }}>
                Chat, Call or Video
              </Text>
              <Text variant="caption" style={{ color: 'rgba(255,255,255,0.85)' }}>
                with expert astrologers
              </Text>
              <View style={[styles.bannerCta, { backgroundColor: theme.colors.accentGold }]}>
                <Text variant="caption" weight="700" style={{ color: '#1A1206' }}>
                  Connect now
                </Text>
                <Ionicons name="arrow-forward" size={14} color="#1A1206" />
              </View>
            </View>
            <Ionicons name="planet" size={72} color="rgba(255,255,255,0.35)" />
          </LinearGradient>
        </Pressable>

        {/* Top astrologers */}
        <View style={styles.section}>
          <SectionHeader
            title="Top Astrologers"
            actionLabel="See All"
            onAction={() => router.push('/(tabs)/astrologers')}
          />
          <View style={styles.list}>
            {topAstrologers.map((a) => (
              <AstrologerCard
                key={a.id}
                astrologer={a}
                onPress={() => router.push(`/astrologer/${a.id}`)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

function toneFor(id: string) {
  const map: Record<string, keyof typeof CATEGORY_TONES> = {
    love: 'love',
    career: 'career',
    finance: 'finance',
    health: 'health',
    marriage: 'family',
    spirituality: 'spirit',
    education: 'education',
  };
  return map[id] ?? 'spirit';
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  intro: { paddingHorizontal: 20, marginTop: 12, gap: 2 },
  searchWrap: { paddingHorizontal: 20, marginTop: 16 },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginTop: 20,
    rowGap: 16,
  },
  chip: { width: '25%', alignItems: 'center', gap: 6 },
  chipIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  bannerWrap: { paddingHorizontal: 20, marginTop: 22 },
  banner: {
    borderRadius: 24,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  bannerText: { gap: 6, flex: 1 },
  bannerCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginTop: 6,
  },
  section: { paddingHorizontal: 20, marginTop: 26, gap: 14 },
  list: { gap: 12 },
});
