import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/auth-provider';
import { Avatar } from '@/components/ui/avatar';
import { Chip } from '@/components/ui/chip';
import { useDialog } from '@/components/ui/dialog-provider';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { getAstrologer } from '@/data/astrologers';
import {
  acceptChat,
  chatPhase,
  formatClock,
  remainingWaitMs,
  saveDesk,
  WAIT_OPTIONS,
  watchCustomerChats,
  watchPanditChats,
  type ChatPhase,
  type LiveChat,
} from '@/state/live-chats';
import { useDesk } from '@/state/use-desk';
import { useAppTheme } from '@/theme/theme-provider';

const PHASE_ORDER: Record<ChatPhase, number> = { waiting: 0, live: 1, missed: 2, ended: 3 };

function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [active]);
  return now;
}

export default function ChatsScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isPandit } = useAuth();
  const desk = useDesk();
  const dialog = useDialog();
  const [chats, setChats] = useState<LiveChat[]>([]);

  useEffect(() => {
    if (!user) return;
    return isPandit ? watchPanditChats(setChats) : watchCustomerChats(user.uid, setChats);
  }, [user, isPandit]);

  const now = useNow(chats.some((c) => c.status === 'waiting'));

  const rows = useMemo(() => {
    if (isPandit) {
      return [...chats].sort(
        (a, b) => PHASE_ORDER[chatPhase(a, now)] - PHASE_ORDER[chatPhase(b, now)] || b.lastAt - a.lastAt,
      );
    }
    const latest = new Map<string, LiveChat>();
    chats.forEach((c) => {
      if (!latest.has(c.panditId)) latest.set(c.panditId, c);
    });
    return [...latest.values()];
  }, [chats, isPandit, now]);

  async function onAccept(chat: LiveChat) {
    try {
      await acceptChat(chat.id);
      router.push({ pathname: '/chat/[id]', params: { id: chat.panditId, thread: chat.id } });
    } catch {
      void dialog.alert({
        title: 'Could not accept',
        message: 'The waiting time ran out before you accepted, or the customer cancelled.',
        tone: 'danger',
        icon: 'time-outline',
      });
    }
  }

  function open(chat: LiveChat) {
    router.push(
      isPandit
        ? { pathname: '/chat/[id]', params: { id: chat.panditId, thread: chat.id } }
        : { pathname: '/chat/[id]', params: { id: chat.panditId } },
    );
  }

  return (
    <Screen>
      <PageHeader
        eyebrow={isPandit ? 'PANDIT DESK' : 'LIVE CHAT'}
        title="Chats"
        subtitle={
          isPandit
            ? 'Accept requests before the timer runs out. Chats delete after 24 hours.'
            : 'Text and photos. Chats delete after 24 hours.'
        }
      />

      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          isPandit && desk ? (
            <View style={[styles.desk, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={styles.deskRow}>
                <View style={styles.flex}>
                  <Text variant="bodyStrong">{desk.online ? 'You are online' : 'You are offline'}</Text>
                  <Text variant="small" color="textMuted">
                    {desk.online ? 'Customers can send you requests.' : 'Customers cannot send requests.'}
                  </Text>
                </View>
                <Switch
                  value={desk.online}
                  onValueChange={(online) => void saveDesk({ ...desk, online })}
                  trackColor={{ true: theme.colors.accentGold, false: theme.colors.borderStrong }}
                  thumbColor="#FFFFFF"
                />
              </View>
              <Text variant="small" color="textMuted">
                Time to accept a request
              </Text>
              <View style={styles.waitRow}>
                {WAIT_OPTIONS.map((w) => (
                  <Chip
                    key={w}
                    label={`${w} min`}
                    active={desk.waitMinutes === w}
                    onPress={() => void saveDesk({ ...desk, waitMinutes: w })}
                  />
                ))}
              </View>
              <Text variant="small" color="textMuted">
                Customers get 2 free minutes per chat, then buy a ₹49 pass with Razorpay. Payments
                appear in your Razorpay dashboard.
              </Text>
            </View>
          ) : undefined
        }
        ListEmptyComponent={
          isPandit ? (
            <EmptyState
              icon="chatbubbles-outline"
              title="No requests yet"
              message="New chat requests from customers appear here instantly."
            />
          ) : (
            <EmptyState
              icon="chatbubbles-outline"
              title="No live chats"
              message="Choose a pandit or maulana and request a chat. It starts as soon as they accept."
              actionLabel="See experts"
              onAction={() => router.push('/(tabs)/astrologers')}
            />
          )
        }
        renderItem={({ item }) => {
          const pandit = getAstrologer(item.panditId);
          const phase = chatPhase(item, now);
          const title = isPandit ? item.customerName : (pandit?.name ?? 'Expert');
          const subtitle =
            phase === 'waiting'
              ? `${isPandit ? `For ${pandit?.name ?? 'expert'} · ` : 'Waiting · '}${formatClock(remainingWaitMs(item, now))} left`
              : phase === 'missed'
                ? 'Not accepted in time'
                : isPandit
                  ? `${pandit?.name ?? 'Expert'} · ${item.lastText}`
                  : item.lastText;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open chat with ${title}`}
              onPress={() => open(item)}
              style={({ pressed }) => [
                styles.row,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: phase === 'waiting' ? theme.colors.accentGold : theme.colors.border,
                  opacity: phase === 'missed' || phase === 'ended' ? 0.6 : 1,
                },
                pressed ? { opacity: 0.8 } : null,
              ]}>
              <Avatar
                uri={isPandit ? item.customerPhoto : pandit?.photo}
                name={title}
                size={52}
                online={phase === 'live'}
              />
              <View style={styles.flex}>
                <View style={styles.topRow}>
                  <Text variant="bodyStrong" numberOfLines={1} style={styles.flex}>
                    {title}
                  </Text>
                  <Text variant="small" color={phase === 'waiting' ? 'accentGold' : phase === 'live' ? 'success' : 'textMuted'}>
                    {phase === 'waiting' ? 'Request' : phase === 'live' ? 'Live' : phase === 'missed' ? 'Missed' : 'Ended'}
                  </Text>
                </View>
                <Text variant="caption" color="textMuted" numberOfLines={1}>
                  {subtitle}
                </Text>
              </View>
              {isPandit && phase === 'waiting' ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Accept chat from ${item.customerName}`}
                  onPress={() => void onAccept(item)}
                  style={styles.accept}>
                  <Text variant="caption" weight="700" style={styles.acceptLabel}>
                    Accept
                  </Text>
                </Pressable>
              ) : null}
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { paddingHorizontal: 20, paddingTop: 16, gap: 10, flexGrow: 1 },
  desk: {
    padding: 16,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
    marginBottom: 6,
  },
  deskRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  waitRow: { flexDirection: 'row', gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  accept: {
    backgroundColor: '#E8C47A',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  acceptLabel: { color: '#1A140C' },
});
