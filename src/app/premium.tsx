import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Screen } from '@/components/ui/screen';
import { useAppTheme } from '@/theme/theme-provider';

const BENEFITS = [
  'Unlimited deep-talk messages',
  'Lower per-minute consultation rates',
  'Priority access to top astrologers',
  'Advanced birth-chart reports',
  'Extended conversation history',
];

const PLANS = [
  { id: 'monthly', title: 'Monthly', price: '₹499', note: 'per month', highlight: false },
  { id: 'yearly', title: 'Yearly', price: '₹3,999', note: 'per year · save 33%', highlight: true },
];

export default function PremiumScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [plan, setPlan] = useState('yearly');

  return (
    <Screen gradient edges={['top']}>
      <View style={styles.header}>
        <BackButton tint="#FFFFFF" />
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 140, paddingHorizontal: 24 }}
        showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <LinearGradient colors={theme.gradients.gold} style={styles.crown}>
            <Ionicons name="diamond" size={36} color="#1A1206" />
          </LinearGradient>
          <Text style={styles.eyebrow}>MEMBERSHIP</Text>
          <Text variant="display" center>
            Private Circle
          </Text>
          <Text variant="body" color="textSecondary" center>
            Priority guides, quieter rates, and a chart that is prepared before you arrive.
          </Text>
        </View>

        <View style={styles.benefits}>
          {BENEFITS.map((b) => (
            <View key={b} style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.accentGold} />
              <Text variant="body">{b}</Text>
            </View>
          ))}
        </View>

        <View style={styles.plans}>
          {PLANS.map((p) => {
            const selected = plan === p.id;
            return (
              <Pressable
                key={p.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setPlan(p.id)}
                style={[
                  styles.plan,
                  {
                    borderColor: selected ? theme.colors.accentGold : theme.colors.border,
                    backgroundColor: theme.colors.surface,
                  },
                ]}>
                <View style={styles.planLeft}>
                  <View
                    style={[
                      styles.radio,
                      { borderColor: selected ? theme.colors.accentGold : theme.colors.borderStrong },
                    ]}>
                    {selected ? (
                      <View style={[styles.radioDot, { backgroundColor: theme.colors.accentGold }]} />
                    ) : null}
                  </View>
                  <View>
                    <Text variant="bodyStrong">{p.title}</Text>
                    <Text variant="small" color="textMuted">
                      {p.note}
                    </Text>
                  </View>
                </View>
                <Text variant="h3" color="accentGold">
                  {p.price}
                </Text>
                {p.highlight ? (
                  <View style={[styles.badge, { backgroundColor: theme.colors.accentGold }]}>
                    <Text variant="tiny" style={{ color: '#1A1206' }}>
                      BEST VALUE
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          label="Enter the Circle"
          variant="gold"
          size="lg"
          onPress={() => router.back()}
        />
        <Text variant="small" color="textMuted" center style={{ marginTop: 10 }}>
          Billed through the app store. Cancel anytime. Prices shown are examples
          until store products are configured.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 8 },
  hero: { alignItems: 'center', gap: 10, marginTop: 8, marginBottom: 24 },
  eyebrow: {
    color: '#E8C47A',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.4,
    marginBottom: 4,
  },
  crown: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  benefits: { gap: 14, marginBottom: 28 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  plans: { gap: 12 },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  planLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  badge: { position: 'absolute', top: -10, right: 16, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
});
