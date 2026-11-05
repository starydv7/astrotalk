import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { SubHeader } from '@/components/ui/sub-header';
import { Text } from '@/components/ui/text';
import { TraditionBadge } from '@/components/astrology/tradition-mark';
import { getAstrologer } from '@/data/astrologers';
import type { Tradition } from '@/types/domain';

type Offering = {
  id: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  tradition: Tradition;
  body: string;
  expertId: string;
};

const OFFERINGS: Offering[] = [
  {
    id: 'nazar',
    icon: 'eye-off-outline',
    title: 'Nazar Dosh Removal',
    tradition: 'vedic',
    body: 'For buri nazar on you, your children or your business. Protective mantras, a simple daily practice and the right time to perform it.',
    expertId: 'pandit-devesh',
  },
  {
    id: 'home',
    icon: 'home-heart',
    title: 'Home & Vastu Cleansing',
    tradition: 'vedic',
    body: 'When the house feels heavy, restless or full of quarrels. Vastu corrections, havan and purification rituals to bring calm back home.',
    expertId: 'pandit-raghav',
  },
  {
    id: 'graha',
    icon: 'orbit',
    title: 'Graha Dosh & Obstacles',
    tradition: 'vedic',
    body: 'Repeated setbacks in work, marriage or health. Kundli-based shanti remedies for Shani, Rahu-Ketu and Mangal dosh.',
    expertId: 'pandit-raghav',
  },
  {
    id: 'ruqyah',
    icon: 'book-open-variant',
    title: 'Ruqyah Shariah',
    tradition: 'islamic',
    body: 'Protection from sihr, nazar and spiritual unrest through Quranic recitation and authentic duas, as taught in the Sunnah.',
    expertId: 'maulana-abdul',
  },
  {
    id: 'family',
    icon: 'shield-star',
    title: 'Family Protection Duas',
    tradition: 'islamic',
    body: 'Duas and guidance for peace between family members, safe travel and the protection of your loved ones.',
    expertId: 'maulana-imran',
  },
];

const SIGNS = [
  'Constant heaviness',
  'Sudden obstacles',
  'Disturbed sleep',
  'Quarrels at home',
  'Business slowing down',
  'Fear without reason',
];

const STEPS = [
  { icon: 'account-search-outline', title: 'Choose your guide', body: 'A pandit or a maulana, whichever tradition you follow.' },
  { icon: 'lock-outline', title: 'Share privately', body: 'Text and photos only. The chat is deleted after 24 hours.' },
  { icon: 'creation', title: 'Receive your remedy', body: 'Clear steps you can follow at home, at your own pace.' },
] as const;

export default function CleansingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <Screen rich edges={['top']}>
      <SubHeader title="Cleansing & Protection" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        <Animated.View entering={FadeInDown.duration(520)}>
          <LinearGradient
            colors={['#2B1A55', '#1A1036', '#0E0A20']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}>
            <View style={styles.heroGlyphs}>
              <MaterialCommunityIcons name="creation" size={22} color="#E8C47A" />
              <View style={styles.heroDivider} />
              <MaterialCommunityIcons name="shield-star-outline" size={22} color="#E8C47A" />
            </View>
            <Text style={styles.eyebrow}>NAZAR · JADU-TONA · NEGATIVITY</Text>
            <Text variant="h1" style={styles.heroTitle}>
              Clear the heaviness.{'\n'}
              <Text variant="h1" color="accentGold">
                Restore your peace.
              </Text>
            </Text>
            <Text variant="body" style={styles.heroBody}>
              Feeling drained, blocked or uneasy at home? Our pandits and maulanas guide you through
              time-honoured remedies, privately over chat.
            </Text>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(520).delay(80)} style={styles.block}>
          <Text style={styles.eyebrow}>WHEN PEOPLE REACH OUT</Text>
          <View style={styles.signs}>
            {SIGNS.map((s) => (
              <View key={s} style={styles.sign}>
                <View style={styles.signDot} />
                <Text variant="small" style={styles.signText}>
                  {s}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <Text style={[styles.eyebrow, styles.blockGap]}>CHOOSE YOUR REMEDY</Text>
        {OFFERINGS.map((o, i) => {
          const expert = getAstrologer(o.expertId);
          if (!expert) return null;
          const islamic = o.tradition === 'islamic';
          return (
            <Animated.View key={o.id} entering={FadeInDown.duration(520).delay(120 + i * 60)}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${o.title} with ${expert.name}`}
                onPress={() => router.push(`/chat/${o.expertId}`)}
                style={({ pressed }) => [pressed && styles.pressed]}>
                <LinearGradient
                  colors={islamic ? ['#0F2A26', '#0C1A1E'] : ['#22183F', '#151028']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.card, islamic && styles.cardIslamic]}>
                  <View style={styles.cardHead}>
                    <View style={[styles.cardIcon, islamic && styles.cardIconIslamic]}>
                      <MaterialCommunityIcons name={o.icon} size={22} color={islamic ? '#7FE0C4' : '#E8C47A'} />
                    </View>
                    <View style={styles.cardTitleWrap}>
                      <Text variant="bodyStrong" style={styles.cardTitle}>
                        {o.title}
                      </Text>
                      <TraditionBadge tradition={o.tradition} compact />
                    </View>
                  </View>
                  <Text variant="small" style={styles.cardBody}>
                    {o.body}
                  </Text>
                  <View style={styles.cardFoot}>
                    <View style={styles.expert}>
                      <Avatar uri={expert.photo} name={expert.name} size={28} />
                      <Text variant="small" style={styles.expertName} numberOfLines={1}>
                        {expert.name}
                      </Text>
                    </View>
                    <View style={styles.cta}>
                      <Text variant="tiny" style={styles.ctaText}>
                        Request chat
                      </Text>
                      <MaterialCommunityIcons name="arrow-right" size={14} color="#1A1206" />
                    </View>
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          );
        })}

        <View style={[styles.block, styles.blockGap]}>
          <Text style={styles.eyebrow}>HOW IT WORKS</Text>
          {STEPS.map((s, i) => (
            <View key={s.title} style={styles.step}>
              <View style={styles.stepIcon}>
                <MaterialCommunityIcons name={s.icon} size={18} color="#E8C47A" />
              </View>
              <View style={styles.stepText}>
                <Text variant="bodyStrong" style={styles.cardTitle}>
                  {i + 1}. {s.title}
                </Text>
                <Text variant="small" style={styles.cardBody}>
                  {s.body}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.note}>
          <MaterialCommunityIcons name="information-outline" size={16} color="#9A93B8" />
          <Text variant="small" style={styles.noteText}>
            Spiritual guidance supports, and never replaces, medical, legal or psychological help. No
            result is guaranteed, and our experts will never ask you to pay outside the app.
          </Text>
        </View>

        <Button
          label="See all experts"
          variant="gold"
          iconRight="arrow-forward"
          onPress={() => router.push('/(tabs)/astrologers')}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 8, gap: 14 },
  eyebrow: { color: '#E8C47A', fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 2.2 },
  hero: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(232,196,122,0.35)',
    padding: 22,
    gap: 10,
    overflow: 'hidden',
  },
  heroGlyphs: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  heroDivider: { width: 28, height: 1, backgroundColor: 'rgba(232,196,122,0.5)' },
  heroTitle: { color: '#FFFFFF', letterSpacing: -0.5 },
  heroBody: { color: '#D7D3EC' },
  block: { gap: 12 },
  blockGap: { marginTop: 10 },
  signs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sign: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(232,196,122,0.22)',
    backgroundColor: 'rgba(232,196,122,0.06)',
  },
  signDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#E8C47A' },
  signText: { color: '#E9E5F8' },
  pressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(232,196,122,0.25)',
    padding: 16,
    gap: 12,
  },
  cardIslamic: { borderColor: 'rgba(127,224,196,0.28)' },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(232,196,122,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(232,196,122,0.35)',
  },
  cardIconIslamic: { backgroundColor: 'rgba(127,224,196,0.10)', borderColor: 'rgba(127,224,196,0.35)' },
  cardTitleWrap: { flex: 1, gap: 2 },
  cardTitle: { color: '#FFFFFF' },
  cardBody: { color: '#C9C4DE', lineHeight: 19 },
  cardFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  expert: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  expertName: { color: '#E9E5F8', flexShrink: 1 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8C47A',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  ctaText: { color: '#1A1206', fontWeight: '700' },
  step: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(232,196,122,0.10)',
  },
  stepText: { flex: 1, gap: 2 },
  note: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  noteText: { color: '#9A93B8', flex: 1, lineHeight: 18 },
});
