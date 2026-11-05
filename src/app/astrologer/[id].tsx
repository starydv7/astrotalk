import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/auth-provider';
import { PanditPortrait } from '@/components/astrology/pandit-portrait';
import { TraditionBadge } from '@/components/astrology/tradition-mark';
import { BackButton } from '@/components/ui/back-button';
import { Badge } from '@/components/ui/badge';
import { Rating, StarRow } from '@/components/ui/rating';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { EmptyState } from '@/components/ui/empty-state';
import { getAstrologer, REVIEWS, servicesFor } from '@/data/astrologers';
import { useDesk } from '@/state/use-desk';
import { useAppTheme } from '@/theme/theme-provider';
import { formatCurrency } from '@/utils/validation';

type TabKey = 'about' | 'services' | 'reviews';

export default function AstrologerProfileScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const astrologer = getAstrologer(String(id));
  const [tab, setTab] = useState<TabKey>('about');
  const [fav, setFav] = useState(false);
  const desk = useDesk();
  const online = desk?.online ?? true;
  const { isPandit } = useAuth();

  if (!astrologer) {
    return (
      <Screen>
        <View style={styles.topBar}>
          <BackButton />
        </View>
        <EmptyState icon="alert-circle-outline" title="Expert not found" />
      </Screen>
    );
  }

  const services = servicesFor(astrologer);

  return (
    <Screen edges={['top']}>
      {/* Hero */}
      <View style={styles.hero}>
        <PanditPortrait
          photo={astrologer.photo}
          name={astrologer.name}
          tradition={astrologer.tradition}
          glyphSize={96}
        />
        <LinearGradient colors={theme.gradients.hero} style={StyleSheet.absoluteFill} />
        <View style={styles.topBar}>
          <BackButton tint="#FFFFFF" />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={fav ? 'Remove from favorites' : 'Add to favorites'}
            onPress={() => setFav((f) => !f)}
            style={[styles.heroBtn, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
            <Ionicons
              name={fav ? 'heart' : 'heart-outline'}
              size={20}
              color={fav ? theme.colors.danger : '#FFFFFF'}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.sheet}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}>
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text variant="h2">{astrologer.name}</Text>
            {online ? <Badge label="Online" tone="success" icon="ellipse" /> : null}
          </View>
          <TraditionBadge tradition={astrologer.tradition} />
          <Rating value={astrologer.rating} reviews={astrologer.reviewCount} />
          <Text variant="caption" color="textMuted">
            {astrologer.specialty} · {astrologer.experienceYears}+ Years Experience
          </Text>
        </View>

        {/* Tabs */}
        <View style={[styles.tabBar, { borderColor: theme.colors.border }]}>
          {(['about', 'services', 'reviews'] as TabKey[]).map((t) => (
            <Pressable key={t} onPress={() => setTab(t)} style={styles.tabItem} accessibilityRole="tab">
              <Text
                variant="bodyStrong"
                color={tab === t ? 'text' : 'textMuted'}
                style={{ textTransform: 'capitalize' }}>
                {t}
              </Text>
              {tab === t ? (
                <View style={[styles.tabUnderline, { backgroundColor: theme.colors.accentGold }]} />
              ) : null}
            </Pressable>
          ))}
        </View>

        <View style={styles.tabContent}>
          {tab === 'about' ? (
            <View style={styles.aboutBlock}>
              <Text variant="body" color="textSecondary">
                {astrologer.about}
              </Text>
              <View style={styles.grid}>
                {services.slice(0, 6).map((s) => (
                  <View key={s.id} style={styles.gridItem}>
                    <View style={[styles.gridIcon, { backgroundColor: theme.colors.primarySoft }]}>
                      <Ionicons
                        name={s.icon as keyof typeof Ionicons.glyphMap}
                        size={18}
                        color={theme.colors.primary}
                      />
                    </View>
                    <Text variant="small" numberOfLines={1}>
                      {s.title}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={styles.statsRow}>
                <Stat value={`${(astrologer.consultations / 1000).toFixed(1)}K`} label="Consultations" />
                <Stat value={`${astrologer.experienceYears}y`} label="Experience" />
                <Stat value={astrologer.languages.join(', ')} label="Languages" />
              </View>
            </View>
          ) : null}

          {tab === 'services' ? (
            <View style={styles.servicesList}>
              {services.map((s) => (
                <View
                  key={s.id}
                  style={[styles.serviceRow, { borderColor: theme.colors.border }]}>
                  <View style={[styles.gridIcon, { backgroundColor: theme.colors.accentGoldSoft }]}>
                    <Ionicons
                      name={s.icon as keyof typeof Ionicons.glyphMap}
                      size={18}
                      color={theme.colors.accentGold}
                    />
                  </View>
                  <Text variant="body" style={{ flex: 1 }}>
                    {s.title}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
                </View>
              ))}
            </View>
          ) : null}

          {tab === 'reviews' ? (
            <View style={styles.reviewsList}>
              {REVIEWS.map((r) => (
                <View key={r.id} style={[styles.reviewCard, { borderColor: theme.colors.border }]}>
                  <View style={styles.reviewHead}>
                    <Text variant="bodyStrong">{r.author}</Text>
                    <Text variant="small" color="textMuted">
                      {r.timeAgo}
                    </Text>
                  </View>
                  <StarRow value={r.rating} size={14} />
                  <Text variant="caption" color="textSecondary">
                    {r.text}
                  </Text>
                </View>
              ))}
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push(`/reviews/${astrologer.id}`)}
                style={styles.seeAll}>
                <Text variant="caption" color="primary" weight="700">
                  See all reviews
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Sticky action bar */}
      <View
        style={[
          styles.actionBar,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
            paddingBottom: insets.bottom + 12,
          },
        ]}>
        <View style={styles.priceBlock}>
          <Text variant="small" color="textMuted">
            {desk ? `Accepts within ${desk.waitMinutes} min` : 'Live chat'}
          </Text>
          <Text variant="h3" color="accentGold">
            {formatCurrency(astrologer.pricePerMinute)}
            <Text variant="small" color="textMuted">
              {' '}
              chat
            </Text>
          </Text>
        </View>
        <View style={styles.actions}>
          <ActionBtn
            icon="chatbubble-ellipses"
            label={isPandit ? 'Open desk' : 'Request chat'}
            primary
            onPress={() => router.push(isPandit ? '/(tabs)/chats' : `/chat/${astrologer.id}`)}
          />
        </View>
      </View>
    </Screen>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text variant="bodyStrong" numberOfLines={1}>
        {value}
      </Text>
      <Text variant="small" color="textMuted">
        {label}
      </Text>
    </View>
  );
}

function ActionBtn({
  icon,
  label,
  onPress,
  primary,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  const theme = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} consultation`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionBtn,
        {
          backgroundColor: primary ? theme.colors.primary : theme.colors.surfaceAlt,
          borderColor: primary ? theme.colors.primary : theme.colors.border,
        },
        pressed ? { opacity: 0.85 } : null,
      ]}>
      <Ionicons name={icon} size={18} color={primary ? '#FFFFFF' : theme.colors.text} />
      <Text variant="small" weight="700" style={{ color: primary ? '#FFFFFF' : theme.colors.text }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: { height: 300 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  heroBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  sheet: {
    marginTop: -28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: 'transparent',
  },
  headerInfo: { paddingHorizontal: 20, paddingTop: 20, gap: 6 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tabBar: {
    flexDirection: 'row',
    marginTop: 20,
    marginHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 28,
  },
  tabItem: { paddingBottom: 10 },
  tabUnderline: { height: 3, borderRadius: 2, marginTop: 8 },
  tabContent: { padding: 20 },
  aboutBlock: { gap: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  gridIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  stat: { flex: 1, gap: 2 },
  servicesList: { gap: 12 },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  reviewsList: { gap: 12 },
  reviewCard: { padding: 14, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, gap: 6 },
  reviewHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  seeAll: { alignItems: 'center', paddingVertical: 8 },
  actionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  priceBlock: { gap: 2 },
  actions: { flexDirection: 'row', gap: 8, flex: 1, justifyContent: 'flex-end' },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 68,
  },
});
