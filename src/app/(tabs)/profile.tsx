import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/auth-provider';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { useDialog } from '@/components/ui/dialog-provider';
import { PageHeader } from '@/components/ui/page-header';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { DEMO_USER } from '@/data/profile';
import { useAppTheme } from '@/theme/theme-provider';
import { formatCurrency } from '@/utils/validation';

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route?: string;
  danger?: boolean;
};

const MENU: MenuItem[] = [
  { icon: 'receipt-outline', label: 'My Consultations', route: '/(tabs)/chats' },
  { icon: 'wallet-outline', label: 'Wallet & Payments', route: '/profile/wallet' },
  { icon: 'heart-outline', label: 'Saved Astrologers', route: '/(tabs)/astrologers' },
  { icon: 'help-circle-outline', label: 'My Questions', route: '/profile/questions' },
  { icon: 'notifications-outline', label: 'Notifications', route: '/profile/notifications' },
  { icon: 'shield-checkmark-outline', label: 'Privacy & Security', route: '/profile/privacy' },
  { icon: 'chatbubble-ellipses-outline', label: 'Help & Support', route: '/profile/support' },
  { icon: 'settings-outline', label: 'Settings', route: '/profile/settings' },
];

export default function ProfileScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile, displayName, isPandit, signOut } = useAuth();
  const dialog = useDialog();

  async function onLogout() {
    const ok = await dialog.confirm({
      title: 'Log out?',
      message: 'You can sign back in anytime with the same account.',
      icon: 'log-out-outline',
      tone: 'danger',
      confirmLabel: 'Log out',
      cancelLabel: 'Stay signed in',
    });
    if (ok) void signOut();
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 128 }}
        showsVerticalScrollIndicator={false}>
        <PageHeader
          eyebrow="YOUR ATLAS"
          title="Profile"
          right={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
              hitSlop={8}
              onPress={() => router.push('/profile/edit')}
              style={[styles.iconBtn, { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border, borderWidth: StyleSheet.hairlineWidth }]}>
              <Ionicons name="create-outline" size={20} color={theme.colors.accentGold} />
            </Pressable>
          }
        />

        {/* User card */}
        <Card style={styles.userCard} onPress={() => router.push('/profile/edit')} elevated>
          <Avatar uri={user?.photoURL} name={displayName} size={64} ring />
          <View style={styles.userInfo}>
            <Text variant="h3" numberOfLines={1}>
              {displayName}
            </Text>
            <Text variant="caption" color="textMuted" numberOfLines={1}>
              {user?.email ?? profile.phone}
            </Text>
            {profile.topics.length > 0 ? (
              <Text variant="small" color="accentGold" numberOfLines={1}>
                {profile.topics.join(' · ')}
              </Text>
            ) : null}
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
        </Card>

        {/* Wallet strip */}
        <Card style={styles.wallet} tone="surfaceAlt" onPress={() => router.push('/profile/wallet')}>
          <View style={styles.walletLeft}>
            <View style={[styles.walletIcon, { backgroundColor: theme.colors.accentGoldSoft }]}>
              <Ionicons name="wallet" size={20} color={theme.colors.accentGold} />
            </View>
            <View>
              <Text variant="small" color="textMuted">
                Wallet balance
              </Text>
              <Text variant="h3">{formatCurrency(DEMO_USER.walletBalance)}</Text>
            </View>
          </View>
          <View style={[styles.addBtn, { backgroundColor: theme.colors.primary }]}>
            <Text variant="caption" weight="700" style={{ color: '#FFFFFF' }}>
              Add money
            </Text>
          </View>
        </Card>

        {isPandit ? (
          <Card style={styles.menu} onPress={() => router.push('/(tabs)/chats')}>
            <View style={styles.walletLeft}>
              <View style={[styles.walletIcon, { backgroundColor: theme.colors.accentGoldSoft }]}>
                <Ionicons name="sparkles" size={20} color={theme.colors.accentGold} />
              </View>
              <View style={styles.userInfo}>
                <Text variant="bodyStrong">Pandit desk</Text>
                <Text variant="small" color="textMuted">
                  You answer chats for every pandit and maulana. Open requests, go online, set the waiting time.
                </Text>
              </View>
            </View>
          </Card>
        ) : null}

        {/* Menu */}
        <Card style={styles.menu} padded={false}>
          {MENU.map((item, i) => (
            <Pressable
              key={item.label}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              onPress={() => item.route && router.push(item.route as never)}
              style={({ pressed }) => [
                styles.menuRow,
                i < MENU.length - 1
                  ? { borderBottomColor: theme.colors.border, borderBottomWidth: StyleSheet.hairlineWidth }
                  : null,
                pressed ? { opacity: 0.7 } : null,
              ]}>
              <View style={[styles.menuIcon, { backgroundColor: theme.colors.surfaceAlt }]}>
                <Ionicons name={item.icon} size={18} color={theme.colors.textSecondary} />
              </View>
              <Text variant="body" style={styles.menuLabel}>
                {item.label}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
            </Pressable>
          ))}
        </Card>

        {/* Premium banner */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Get Premium"
          onPress={() => router.push('/premium')}
          style={styles.premiumWrap}>
          <LinearGradient
            colors={theme.gradients.premium}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.premium}>
            <Ionicons name="diamond" size={28} color="#FFFFFF" />
            <View style={styles.premiumText}>
              <Text variant="title" style={{ color: '#FFFFFF' }}>
                Private Circle
              </Text>
              <Text variant="small" style={{ color: 'rgba(255,255,255,0.85)' }}>
                Priority guides, quieter rates, charts prepared for you
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => void onLogout()}
          style={({ pressed }) => [
            styles.logout,
            { borderColor: theme.colors.border },
            pressed ? { opacity: 0.7 } : null,
          ]}>
          <Ionicons name="log-out-outline" size={18} color={theme.colors.danger} />
          <Text variant="bodyStrong" color="danger">
            Log out
          </Text>
        </Pressable>

        <Text variant="small" color="textMuted" center style={styles.version}>
          AstroTalk · Private Circle
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  userCard: {
    marginHorizontal: 20,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  userInfo: { flex: 1, gap: 2 },
  wallet: {
    marginHorizontal: 20,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  walletLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  walletIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  addBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  menu: { marginHorizontal: 20, marginTop: 14 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  menuIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1 },
  premiumWrap: { marginHorizontal: 20, marginTop: 16 },
  premium: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: 20,
  },
  premiumText: { flex: 1, gap: 2 },
  logout: {
    marginHorizontal: 20,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 999,
    borderWidth: 1,
  },
  version: { marginTop: 16 },
});
