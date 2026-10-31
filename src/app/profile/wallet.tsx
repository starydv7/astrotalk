import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { SubHeader } from '@/components/ui/sub-header';
import { Text } from '@/components/ui/text';
import { DEMO_USER } from '@/data/profile';
import { useAppTheme } from '@/theme/theme-provider';
import { formatCurrency } from '@/utils/validation';

const TOPUPS = [100, 250, 500, 1000];

const HISTORY = [
  { id: 't1', label: 'Chat with Acharya Sharma', amount: -98, time: 'Today' },
  { id: 't2', label: 'Wallet top-up', amount: 250, time: 'Yesterday' },
  { id: 't3', label: 'Voice call with Rohit Joshi', amount: -135, time: 'Mon' },
];

export default function WalletScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <Screen edges={['top']}>
      <SubHeader title="Wallet & Payments" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}>
        <LinearGradient colors={theme.gradients.premium} style={styles.balanceCard}>
          <Text variant="small" style={{ color: 'rgba(255,255,255,0.8)' }}>
            Available balance
          </Text>
          <Text variant="display" style={{ color: '#FFFFFF' }}>
            {formatCurrency(DEMO_USER.walletBalance)}
          </Text>
          <Text variant="small" style={{ color: 'rgba(255,255,255,0.8)' }}>
            Use your balance for chats and calls
          </Text>
        </LinearGradient>

        <Text variant="caption" color="textMuted" style={styles.section}>
          Add money
        </Text>
        <View style={styles.topups}>
          {TOPUPS.map((amt) => (
            <Pressable
              key={amt}
              accessibilityRole="button"
              accessibilityLabel={`Add ${formatCurrency(amt)}`}
              style={[
                styles.topup,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}>
              <Text variant="bodyStrong">{formatCurrency(amt)}</Text>
            </Pressable>
          ))}
        </View>

        <Text variant="caption" color="textMuted" style={styles.section}>
          Recent transactions
        </Text>
        <Card padded={false}>
          {HISTORY.map((h, i) => (
            <View
              key={h.id}
              style={[
                styles.txn,
                i < HISTORY.length - 1
                  ? { borderBottomColor: theme.colors.border, borderBottomWidth: StyleSheet.hairlineWidth }
                  : null,
              ]}>
              <View
                style={[
                  styles.txnIcon,
                  { backgroundColor: h.amount > 0 ? 'rgba(52,199,123,0.16)' : theme.colors.surfaceAlt },
                ]}>
                <Ionicons
                  name={h.amount > 0 ? 'arrow-down' : 'arrow-up'}
                  size={16}
                  color={h.amount > 0 ? theme.colors.success : theme.colors.textSecondary}
                />
              </View>
              <View style={styles.txnInfo}>
                <Text variant="body" numberOfLines={1}>
                  {h.label}
                </Text>
                <Text variant="small" color="textMuted">
                  {h.time}
                </Text>
              </View>
              <Text variant="bodyStrong" color={h.amount > 0 ? 'success' : 'text'}>
                {h.amount > 0 ? '+' : ''}
                {formatCurrency(Math.abs(h.amount))}
              </Text>
            </View>
          ))}
        </Card>

        <Text variant="small" color="textMuted" center style={styles.note}>
          Payments are processed securely. Card details are never stored on your device.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 12 },
  balanceCard: { borderRadius: 24, padding: 22, gap: 4 },
  section: { marginTop: 10, marginLeft: 4 },
  topups: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  topup: {
    width: '47%',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  txn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  txnIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  txnInfo: { flex: 1, gap: 2 },
  note: { marginTop: 8 },
});
