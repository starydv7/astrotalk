import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PanditPortrait } from '@/components/astrology/pandit-portrait';
import { TraditionMark } from '@/components/astrology/tradition-mark';
import { KundliOrbit } from '@/components/brand/kundli-orbit';
import { Logo } from '@/components/brand/logo';
import { Text } from '@/components/ui/text';
import { MAULANAS, PANDITS } from '@/data/astrologers';
import { CATEGORIES } from '@/data/categories';
import { TONIGHT, signForToday } from '@/data/sky';
import { useDesk } from '@/state/use-desk';
import { CATEGORY_TONES } from '@/theme/category-tone';
import { useAppTheme } from '@/theme/theme-provider';
import type { Astrologer, Tradition } from '@/types/domain';

const CONSULT_MODES = [
  {
    id: 'chat',
    label: 'Live chat',
    detail: '2 min free · then ₹49 for 24 hours',
    icon: 'chatbubble-ellipses' as const,
    colors: ['#241B4D', '#1A1340'] as const,
    ring: '#E8C47A',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const desk = useDesk();
  const online = desk?.online ?? true;
  const today = useMemo(() => signForToday(), []);

  return (
    <View style={[styles.root, { backgroundColor: '#07060F' }]}>
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 128 }}>
        {/* ===== HERO ===== */}
        <View style={[styles.hero, { height: 360 + insets.top }]}>
          <LinearGradient
            colors={['#1E1446', '#120C2C', '#07060F']}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View pointerEvents="none" style={styles.violetBloom} />

          <Animated.View
            entering={FadeIn.duration(1200)}
            pointerEvents="none"
            style={[styles.orbit, { top: insets.top + 54 }]}>
            <KundliOrbit size={290} />
          </Animated.View>

          <LinearGradient
            pointerEvents="none"
            colors={['rgba(7,6,15,0.85)', 'rgba(7,6,15,0.35)', 'rgba(7,6,15,0)']}
            locations={[0, 0.45, 0.75]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(7,6,15,0)', '#07060F']}
            style={styles.heroFade}
          />

          <View style={[styles.heroContent, { paddingTop: insets.top + 8 }]}>
            {/* Top bar */}
            <View style={styles.topBar}>
              <Logo size="sm" />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Notifications"
                hitSlop={8}
                onPress={() => router.push('/profile/notifications')}
                style={styles.bell}>
                <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
                <View style={styles.bellDot} />
              </Pressable>
            </View>

            {/* Headline */}
            <Animated.View entering={FadeInDown.duration(700).delay(150)} style={styles.headline}>
              <Text style={styles.heroEyebrow}>VEDIC · ISLAMIC · SPIRITUAL</Text>
              <Text style={styles.headlineText}>Life&apos;s</Text>
              <Text style={styles.headlineText}>Questions,</Text>
              <Text style={styles.headlineGold}>Written in</Text>
              <Text style={styles.headlineGold}>the Stars</Text>
              <Text variant="body" style={styles.heroSub}>
                Private chats with trusted{'\n'}pandits and maulanas.
              </Text>
            </Animated.View>
          </View>
        </View>

        {/* ===== SEARCH (overlaps hero bottom) ===== */}
        <Animated.View entering={FadeInDown.duration(560).delay(40)} style={styles.searchWrap}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#8A8172" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search astrologers, topics, or questions..."
              placeholderTextColor="#8A8172"
              style={styles.searchInput}
              returnKeyType="search"
              onSubmitEditing={() => router.push('/(tabs)/astrologers')}
            />
          </View>
        </Animated.View>

        {/* ===== CONSULTATION MODES ===== */}
        <Animated.View entering={FadeInDown.duration(560).delay(90)} style={styles.modesRow}>
          {CONSULT_MODES.map((m) => (
            <Pressable
              key={m.id}
              accessibilityRole="button"
              accessibilityLabel={m.label}
              onPress={() => router.push('/(tabs)/astrologers')}
              style={({ pressed }) => [styles.modeCard, pressed ? { opacity: 0.85 } : null]}>
              <LinearGradient
                colors={m.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.modeInner, { borderColor: m.ring }]}>
                <View style={[styles.modeIcon, { backgroundColor: m.ring }]}>
                  <Ionicons name={m.icon} size={16} color="#1A1206" />
                </View>
                <View style={styles.modeTextWrap}>
                  <Text variant="bodyStrong" style={styles.modeLabel}>
                    {m.label}
                  </Text>
                  <Text style={styles.modePrice}>{m.detail}</Text>
                </View>
              </LinearGradient>
            </Pressable>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(560).delay(120)} style={styles.skyWrap}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open tonight's sky"
            onPress={() => router.push('/horoscope')}>
            <LinearGradient
              colors={['#1A1430', '#2A1B48']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sky}>
              <View style={styles.skyCopy}>
                <Text style={styles.skyEyebrow}>TONIGHT&apos;S SKY</Text>
                <Text variant="h3">
                  {today.label} · {TONIGHT.moon}
                </Text>
                <Text style={styles.skyLine} numberOfLines={2}>
                  {today.line}
                </Text>
              </View>
              <Text style={styles.skyGlyph}>{today.glyph}</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* ===== CATEGORY GRID (4 x 2) ===== */}
        <Animated.View entering={FadeInDown.duration(560).delay(150)} style={styles.grid}>
          {CATEGORIES.map((cat) => {
            const tone = CATEGORY_TONES[cat.tone];
            return (
              <Pressable
                key={cat.id}
                accessibilityRole="button"
                accessibilityLabel={cat.title}
                onPress={() => router.push('/(tabs)/astrologers')}
                style={({ pressed }) => [
                  styles.gridItem,
                  { backgroundColor: '#141022', borderColor: 'rgba(232,196,122,0.14)' },
                  pressed ? { opacity: 0.85 } : null,
                ]}>
                <View style={[styles.gridIcon, { backgroundColor: tone.bg }]}>
                  <MaterialCommunityIcons
                    name={cat.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={24}
                    color={tone.fg}
                  />
                </View>
                <Text style={styles.gridLabel} numberOfLines={2}>
                  {gridTitle(cat.id)}
                </Text>
              </Pressable>
            );
          })}
        </Animated.View>

        <ExpertRail
          eyebrow="VEDIC JYOTISH"
          title="Our Pandits"
          tradition="vedic"
          experts={PANDITS}
          online={online}
        />

        {/* ===== CLEANSING BANNER ===== */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Nazar and negativity cleansing"
          onPress={() => router.push('/cleansing')}
          style={({ pressed }) => [styles.bannerWrap, pressed && { opacity: 0.9 }]}>
          <LinearGradient
            colors={['#120D26', '#2A1640', '#4A1F3A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.banner, styles.cleanseBanner]}>
            <View style={styles.cleanseGlyphs}>
              <MaterialCommunityIcons name="creation" size={16} color="#E8C47A" />
              <View style={styles.cleanseDivider} />
              <MaterialCommunityIcons name="home-heart" size={16} color="#E8C47A" />
            </View>
            <Text style={styles.cleanseEyebrow}>NAZAR · JADU-TONA · NEGATIVITY</Text>
            <Text variant="h3" style={{ color: '#FFFFFF' }}>
              Cleanse your home
            </Text>
            <Text variant="h3" color="accentGold">
              and your aura
            </Text>
            <Text style={styles.bannerSub}>
              Havan, Vastu, Nazar dosh, Ruqyah and protective duas,{'\n'}guided privately by our experts.
            </Text>
            <View style={styles.bannerCta}>
              <Text variant="caption" weight="700" style={{ color: '#1A1206' }}>
                Explore remedies
              </Text>
              <Ionicons name="arrow-forward" size={13} color="#1A1206" />
            </View>
            <MaterialCommunityIcons
              name="shield-star"
              size={86}
              color="rgba(232,196,122,0.16)"
              style={styles.bannerArt}
            />
          </LinearGradient>
        </Pressable>

        <ExpertRail
          eyebrow="ISLAMIC GUIDANCE"
          title="Our Maulanas"
          tradition="islamic"
          experts={MAULANAS}
          online={online}
        />

        {/* ===== KUNDLI BANNER ===== */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Get your personalized Kundli report"
          onPress={() => router.push('/astrology/birth-details')}
          style={styles.bannerWrap}>
          <LinearGradient
            colors={['#2A1B5E', '#3A1F6E', '#5B2E8E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.banner, { borderColor: 'rgba(232,196,122,0.35)' }]}>
            <View style={styles.bannerText}>
              <Text variant="h3" style={{ color: '#FFFFFF' }}>
                Get Your Personalized
              </Text>
              <Text variant="h3" color="accentGold">
                Kundli Report
              </Text>
              <Text style={styles.bannerSub}>
                Understand your life path, strengths and{'\n'}opportunities with detailed analysis.
              </Text>
              <View style={styles.bannerCta}>
                <Text variant="caption" weight="700" style={{ color: '#1A1206' }}>
                  Generate Now
                </Text>
                <Ionicons name="arrow-forward" size={13} color="#1A1206" />
              </View>
            </View>
            <Ionicons name="planet" size={64} color="rgba(255,255,255,0.3)" style={styles.bannerArt} />
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </View>
  );
}

type ExpertRailProps = {
  eyebrow: string;
  title: string;
  experts: Astrologer[];
  online: boolean;
  tradition: Tradition;
};

function ExpertRail({ eyebrow, title, experts, online, tradition }: ExpertRailProps) {
  const theme = useAppTheme();
  const router = useRouter();

  if (experts.length === 0) return null;

  return (
    <>
      <View style={styles.sectionHead}>
        <View>
          <View style={styles.sectionEyebrowRow}>
            <TraditionMark tradition={tradition} size={12} color={theme.colors.accentGold} />
            <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
          </View>
          <Text variant="h3" style={{ color: '#FFFFFF' }}>
            {title}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(tabs)/astrologers')}
          hitSlop={8}
          style={styles.seeAll}>
          <Text variant="caption" color="accentGold" weight="700">
            See All
          </Text>
          <Ionicons name="chevron-forward" size={14} color={theme.colors.accentGold} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.astroRow}>
        {experts.map((a) => (
          <View key={a.id} style={styles.astroCard}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={a.name}
              onPress={() => router.push(`/astrologer/${a.id}`)}>
              <View style={styles.astroImgWrap}>
                <PanditPortrait photo={a.photo} name={a.name} tradition={a.tradition} glyphSize={44} />
                <LinearGradient
                  colors={['rgba(7,6,15,0)', 'rgba(7,6,15,0.75)']}
                  style={styles.astroImgFade}
                />
                <View style={styles.onlineBadge}>
                  <View style={[styles.onlineDot, !online && styles.offlineDot]} />
                  <Text style={[styles.onlineText, !online && styles.offlineText]}>
                    {online ? 'Online' : 'Offline'}
                  </Text>
                </View>
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={11} color={theme.colors.accentGold} />
                  <Text style={styles.ratingText}>
                    {a.rating.toFixed(1)} ({formatReviews(a.reviewCount)})
                  </Text>
                </View>
              </View>
            </Pressable>
            <View style={styles.astroNameRow}>
              <Text variant="bodyStrong" style={styles.astroName} numberOfLines={1}>
                {a.name}
              </Text>
              {a.verified ? <Ionicons name="checkmark-circle" size={14} color={theme.colors.accentGold} /> : null}
            </View>
            <Text style={styles.astroSpec} numberOfLines={1}>
              {a.specialty}
            </Text>
            <View style={styles.astroFooter}>
              <View style={styles.pricePill}>
                <Text style={styles.priceText}>{a.experienceYears} yrs exp</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Chat with ${a.name}`}
                onPress={() => router.push(`/chat/${a.id}`)}
                style={[styles.circleBtn, { backgroundColor: theme.colors.accentGold }]}>
                <Ionicons name="chatbubble-ellipses" size={15} color="#1A140C" />
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </>
  );
}

function gridTitle(id: string) {
  const map: Record<string, string> = {
    love: 'Love &\nRelationship',
    career: 'Career &\nBusiness',
    finance: 'Finance &\nWealth',
    health: 'Health &\nWellness',
    marriage: 'Marriage &\nFamily',
    spirituality: 'Spirituality &\nLife Purpose',
    education: 'Education\n& Exams',
    property: 'Property &\nReal Estate',
  };
  return map[id] ?? '';
}

function formatReviews(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  hero: { overflow: 'hidden' },
  violetBloom: {
    position: 'absolute',
    top: 40,
    right: -60,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(124,92,255,0.14)',
  },
  orbit: { position: 'absolute', right: -86 },
  heroFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 90 },
  heroContent: { flex: 1, paddingHorizontal: 20 },
  heroEyebrow: {
    color: '#E8C47A',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 2.4,
    marginBottom: 8,
  },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bell: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  bellDot: {
    position: 'absolute',
    top: 8,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F5455C',
  },
  headline: { marginTop: 18 },
  headlineText: { color: '#FFFFFF', fontSize: 33, lineHeight: 38, fontWeight: '800', letterSpacing: -0.6 },
  headlineGold: { color: '#E8C47A', fontSize: 33, lineHeight: 38, fontWeight: '800', letterSpacing: -0.6 },
  heroSub: { color: '#D7D3EC', marginTop: 12 },

  searchWrap: { paddingHorizontal: 20, marginTop: -26 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    borderRadius: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F3EDE3',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1A140C', padding: 0 },

  modesRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginTop: 16 },
  modeCard: { flex: 1 },
  modeInner: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modeIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  modeTextWrap: { flex: 1, alignItems: 'flex-start' },
  modeLabel: { color: '#FFFFFF', fontSize: 13 },
  modePrice: { color: 'rgba(255,255,255,0.75)', fontSize: 12, lineHeight: 16, marginTop: 2 },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginTop: 18,
    gap: 10,
  },
  gridItem: {
    width: '22.6%',
    aspectRatio: 0.86,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    gap: 8,
  },
  gridIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  gridLabel: { color: '#D7D3EC', fontSize: 10, lineHeight: 13, fontWeight: '600', textAlign: 'center' },

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionEyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionEyebrow: { color: '#E8C47A', fontSize: 10, lineHeight: 14, fontWeight: '700', letterSpacing: 2.2 },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },

  astroRow: { paddingHorizontal: 20, paddingTop: 14, gap: 12 },
  astroCard: {
    width: 180,
    backgroundColor: '#141022',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(232,196,122,0.18)',
    padding: 10,
  },
  astroImgWrap: { height: 168, borderRadius: 16, overflow: 'hidden', backgroundColor: '#0E0A20' },
  astroImgFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 60 },
  astroNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  onlineBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(14,20,15,0.8)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#34C77B' },
  onlineText: { color: '#34C77B', fontSize: 9, fontWeight: '700' },
  offlineDot: { backgroundColor: '#8A84A3' },
  offlineText: { color: '#8A84A3' },
  ratingBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(14,11,30,0.85)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  ratingText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  astroName: { color: '#FFFFFF', flexShrink: 1 },
  astroSpec: { color: '#9AA0C0', fontSize: 11, marginTop: 1 },
  astroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  pricePill: {
    backgroundColor: 'rgba(232,196,122,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  priceText: { color: '#E8C47A', fontSize: 11, fontWeight: '700' },
  circleBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  cleanseBanner: { borderColor: 'rgba(232,196,122,0.4)', gap: 0 },
  cleanseGlyphs: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  cleanseDivider: { width: 22, height: 1, backgroundColor: 'rgba(232,196,122,0.5)' },
  cleanseEyebrow: { color: '#E8C47A', fontSize: 10, lineHeight: 14, fontWeight: '700', letterSpacing: 2, marginBottom: 6 },

  bannerWrap: { paddingHorizontal: 20, marginTop: 24 },
  banner: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    overflow: 'hidden',
  },
  bannerText: { gap: 2 },
  bannerSub: { color: '#D7D3EC', fontSize: 11, lineHeight: 16, marginTop: 6 },
  bannerCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: '#E8C47A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginTop: 12,
  },
  bannerArt: { position: 'absolute', right: 14, bottom: 14 },
  skyWrap: { paddingHorizontal: 20, marginTop: 16 },
  sky: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(232,196,122,0.35)',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    overflow: 'hidden',
  },
  skyCopy: { flex: 1, gap: 4 },
  skyEyebrow: { color: '#E8C47A', fontSize: 11, fontWeight: '700', letterSpacing: 2.2 },
  skyLine: { color: '#D7D3EC', fontSize: 12, lineHeight: 17 },
  skyGlyph: { fontSize: 36, color: '#F6E7C1' },
});
