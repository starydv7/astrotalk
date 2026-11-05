import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { useDialog } from '@/components/ui/dialog-provider';
import { Text } from '@/components/ui/text';
import { buyChatPass, paymentsConfigured } from '@/lib/payments';
import { PASS_PRICE } from '@/state/chat-pass';

type PassPaywallProps = {
  /** Shown above the price, e.g. why the chat is locked. */
  headline?: string;
};

export function PassPaywall({ headline }: PassPaywallProps) {
  const dialog = useDialog();
  const [busy, setBusy] = useState(false);

  async function onPay() {
    setBusy(true);
    try {
      const result = await buyChatPass();
      if (result.status === 'success') {
        void dialog.alert({
          title: 'Pass activated',
          message: 'Enjoy 24 hours of unlimited chat with every expert.',
          icon: 'shield-checkmark',
          tone: 'success',
          confirmLabel: 'Continue chatting',
        });
      } else if (result.status === 'failed') {
        void dialog.alert({ title: 'Payment not completed', message: result.message, tone: 'danger', icon: 'card-outline' });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <LinearGradient colors={['#2A1B55', '#170F30']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      {headline ? <Text style={styles.eyebrow}>{headline}</Text> : null}
      <View style={styles.priceRow}>
        <Text style={styles.price}>₹{PASS_PRICE}</Text>
        <View style={styles.flex}>
          <Text variant="bodyStrong" style={styles.title}>
            24-hour chat pass
          </Text>
          <Text variant="small" style={styles.muted}>
            Unlimited text and photo chat with every expert.
          </Text>
        </View>
      </View>
      {paymentsConfigured ? (
        <>
          <Button
            label={`Pay ₹${PASS_PRICE} securely`}
            icon="lock-closed"
            variant="gold"
            fullWidth
            loading={busy}
            onPress={() => void onPay()}
          />
          <View style={styles.methods}>
            <Ionicons name="shield-checkmark-outline" size={13} color="#8A84A3" />
            <Text variant="tiny" style={styles.muted}>
              UPI, cards, netbanking and wallets · secured by Razorpay
            </Text>
          </View>
        </>
      ) : (
        <Text variant="small" style={styles.muted}>
          Payments are being set up. Please try again in a little while.
        </Text>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(232,196,122,0.4)',
    padding: 16,
    gap: 12,
  },
  eyebrow: { color: '#E8C47A', fontSize: 10, lineHeight: 14, fontWeight: '700', letterSpacing: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  price: { color: '#F6E7C1', fontSize: 34, lineHeight: 40, fontWeight: '800' },
  title: { color: '#FFFFFF' },
  muted: { color: '#BDB7D6' },
  methods: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
});
