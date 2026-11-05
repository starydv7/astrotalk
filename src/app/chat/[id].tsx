import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/auth-provider';
import { PassPaywall } from '@/components/chat/pass-paywall';
import { Avatar } from '@/components/ui/avatar';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { useDialog } from '@/components/ui/dialog-provider';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { expertNoun, getAstrologer } from '@/data/astrologers';
import { chatAccess, formatRemaining, PASS_PRICE, type ChatAccess } from '@/state/chat-pass';
import {
  acceptChat,
  chatPhase,
  endChat,
  formatClock,
  remainingWaitMs,
  requestChat,
  sendLiveMessage,
  watchChat,
  watchCustomerChats,
  watchMessages,
  type LiveChat,
  type LiveMessage,
} from '@/state/live-chats';
import { usePassUntil } from '@/state/use-chat-pass';
import { useDesk } from '@/state/use-desk';
import { useAppTheme } from '@/theme/theme-provider';
import { usePrivateScreen } from '@/utils/private-screen';

/** Firestore documents are capped at 1 MiB; keep photos well under it. */
const MAX_PHOTO_CHARS = 850_000;

function failureMessage(error: unknown, fallback: string, needsPass = false) {
  const code = (error as { code?: string } | null)?.code;
  if (code === 'permission-denied') {
    return needsPass
      ? `Your 2 free minutes are over. Get the ₹${PASS_PRICE} 24-hour pass to keep chatting.`
      : 'The chat service refused this action. If you are setting up the app, publish the Firestore rules.';
  }
  if (code === 'unavailable') return 'No connection to the chat service. Check your internet and try again.';
  return fallback;
}

export default function ChatScreen() {
  usePrivateScreen();
  const theme = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, thread } = useLocalSearchParams<{ id: string; thread?: string }>();
  const panditId = String(id);
  const pandit = getAstrologer(panditId);
  const { user, isPandit, displayName } = useAuth();
  const desk = useDesk();
  const dialog = useDialog();

  const [chat, setChat] = useState<LiveChat | null>(null);
  const [ready, setReady] = useState(false);
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const listRef = useRef<FlatList<LiveMessage>>(null);

  useEffect(() => {
    if (!user) return;
    if (isPandit) {
      if (!thread) return;
      return watchChat(String(thread), (next) => {
        setChat(next);
        setReady(true);
      });
    }
    return watchCustomerChats(user.uid, (chats) => {
      setChat(chats.find((c) => c.panditId === panditId) ?? null);
      setReady(true);
    });
  }, [user, isPandit, thread, panditId]);

  const chatId = chat?.id;
  useEffect(() => {
    if (!chatId) return;
    return watchMessages(chatId, setMessages);
  }, [chatId]);

  const phase = chat ? chatPhase(chat, now) : null;
  const passUntil = usePassUntil(isPandit ? chat?.customerUid : user?.uid);
  const [showPaywall, setShowPaywall] = useState(false);
  const access = chatAccess(chat, passUntil, now);

  const tickMs = phase === 'waiting' || (phase === 'live' && access.kind === 'free') ? 1000 : phase === 'live' ? 30_000 : 0;
  useEffect(() => {
    if (!tickMs) return;
    const timer = setInterval(() => setNow(Date.now()), tickMs);
    return () => clearInterval(timer);
  }, [tickMs]);

  const mine: LiveMessage['from'] = isPandit ? 'pandit' : 'customer';
  const title = isPandit ? (chat?.customerName ?? 'Customer') : (pandit?.name ?? 'Expert');
  const noun = expertNoun(pandit);
  const locked = !isPandit && phase === 'live' && access.kind === 'locked';

  async function run(task: () => Promise<void>, failure: string) {
    setBusy(true);
    try {
      await task();
    } catch (error) {
      const denied = (error as { code?: string } | null)?.code === 'permission-denied';
      const needsPass = denied && !isPandit && phase === 'live' && chatAccess(chat, passUntil).kind !== 'pass';
      void dialog.alert({
        title: needsPass ? 'Free time is over' : 'Something went wrong',
        message: failureMessage(error, failure, needsPass),
        tone: needsPass ? 'gold' : 'danger',
        icon: needsPass ? 'time-outline' : undefined,
      });
      setNow(Date.now());
    } finally {
      setBusy(false);
    }
  }

  function onRequest() {
    if (!user || !desk) return;
    void run(async () => {
      await requestChat({
        panditId,
        customerUid: user.uid,
        customerName: displayName,
        customerPhoto: user.photoURL,
        waitMinutes: desk.waitMinutes,
      });
      setNow(Date.now());
    }, 'Could not send the request. Check your internet and try again.');
  }

  function onAccept() {
    if (!chat) return;
    void run(() => acceptChat(chat.id), 'The waiting time ran out before you accepted.');
  }

  async function onEnd() {
    if (!chat) return;
    const waiting = phase === 'waiting';
    const ok = await dialog.confirm({
      title: waiting ? 'Cancel this request?' : 'End this chat?',
      message: waiting
        ? `The ${noun} will no longer see your request.`
        : 'Neither of you can send messages after the chat ends. It is deleted within 24 hours.',
      tone: 'danger',
      icon: waiting ? 'close' : 'exit-outline',
      confirmLabel: waiting ? 'Cancel request' : 'End chat',
      cancelLabel: waiting ? 'Keep waiting' : 'Stay in chat',
    });
    if (ok) void run(() => endChat(chat.id), 'Could not end the chat.');
  }

  function sendText() {
    if (!chat || !draft.trim()) return;
    const text = draft;
    setDraft('');
    void run(
      () => sendLiveMessage(chat, { from: mine, kind: 'text', text }),
      'Message not sent. Check your internet and try again.',
    );
  }

  async function sendPhoto() {
    if (!chat) return;
    if (Platform.OS !== 'web') {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        void dialog.alert({
          title: 'Allow photo access',
          message: 'AstroTalk needs access to your photos to send a picture in this chat.',
          icon: 'image-outline',
        });
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.25,
      base64: true,
    });
    const asset = result.canceled ? null : result.assets[0];
    if (!asset?.base64) return;
    const image = `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`;
    if (image.length > MAX_PHOTO_CHARS) {
      void dialog.alert({
        title: 'Photo too large',
        message: 'Crop the photo to a smaller area and try again.',
        icon: 'crop-outline',
      });
      return;
    }
    void run(
      () => sendLiveMessage(chat, { from: mine, kind: 'photo', image }),
      'Photo not sent. Check your internet and try again.',
    );
  }

  const canRequest = !isPandit && (!chat || phase === 'missed' || phase === 'ended');

  return (
    <Screen edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <BackButton />
        <Pressable
          accessibilityRole="button"
          style={styles.headerInfo}
          onPress={() => pandit && router.push(`/astrologer/${pandit.id}`)}>
          <Avatar
            uri={isPandit ? chat?.customerPhoto : pandit?.photo}
            name={title}
            size={40}
            online={phase === 'live'}
          />
          <View style={styles.flex}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {title}
            </Text>
            <Text variant="small" color="textMuted" numberOfLines={1}>
              {isPandit ? `Chat for ${pandit?.name ?? 'expert'}` : phase === 'live' ? 'Live · text and photo' : 'Text and photo only'}
            </Text>
          </View>
        </Pressable>
        {phase === 'live' || phase === 'waiting' ? (
          <Pressable accessibilityRole="button" accessibilityLabel="End chat" onPress={() => void onEnd()} hitSlop={8}>
            <Text variant="caption" color="danger" weight="700">
              {phase === 'waiting' ? 'Cancel' : 'End'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {!ready && !(isPandit && !thread) ? (
        <View style={styles.gate}>
          <ActivityIndicator color={theme.colors.accentGold} />
        </View>
      ) : isPandit && !chat ? (
        <View style={styles.gate}>
          <Text variant="h2">Chat not available</Text>
          <Text variant="body" color="textSecondary">
            This chat has ended or was deleted after 24 hours. Open the Chats tab to see current requests.
          </Text>
          <Button label="Go to Chats" variant="gold" onPress={() => router.replace('/(tabs)/chats')} />
        </View>
      ) : canRequest && phase !== 'ended' ? (
        <View style={styles.gate}>
          <Text style={styles.eyebrow}>{phase === 'missed' ? 'NOT ACCEPTED IN TIME' : 'LIVE CHAT'}</Text>
          <Text variant="h2">
            {phase === 'missed' ? `${pandit?.name ?? `The ${noun}`} was busy` : 'Request a conversation'}
          </Text>
          <Text variant="body" color="textSecondary">
            {desk?.online === false
              ? `The ${noun} is offline right now. Please try again later.`
              : `The ${noun} accepts within ${desk?.waitMinutes ?? 2} minutes. You can send text and photos. The chat is deleted after 24 hours.`}
          </Text>
          <View style={[styles.pricing, { borderColor: theme.colors.borderStrong }]}>
            {access.kind === 'pass' ? (
              <PriceLine icon="shield-checkmark" text={`Your 24-hour pass is active · ${formatRemaining(access.until - now)} left`} />
            ) : (
              <>
                <PriceLine icon="gift-outline" text="First 2 minutes of every chat are free" />
                <PriceLine icon="infinite" text={`₹${PASS_PRICE} for 24 hours of unlimited chat with all experts`} />
              </>
            )}
          </View>
          <Button
            label={phase === 'missed' ? 'Request again' : 'Request chat'}
            variant="gold"
            loading={busy}
            disabled={!desk || desk.online === false}
            onPress={onRequest}
          />
        </View>
      ) : phase === 'waiting' && chat ? (
        <View style={styles.gate}>
          <Text style={styles.eyebrow}>{isPandit ? 'NEW REQUEST' : `WAITING FOR THE ${noun.toUpperCase()}`}</Text>
          <Text variant="display" color="accentGold">
            {formatClock(remainingWaitMs(chat, now))}
          </Text>
          <Text variant="body" color="textSecondary">
            {isPandit
              ? `${chat.customerName} wants to chat with ${pandit?.name ?? 'you'}. Accept before the timer ends.`
              : `Your request has been sent. The chat opens as soon as the ${noun} accepts.`}
          </Text>
          {isPandit ? <Button label="Accept request" variant="gold" loading={busy} onPress={onAccept} /> : null}
        </View>
      ) : isPandit && phase === 'missed' ? (
        <View style={styles.gate}>
          <Text style={styles.eyebrow}>MISSED</Text>
          <Text variant="h2">Request expired</Text>
          <Text variant="body" color="textSecondary">
            The waiting time ran out before this request was accepted.
          </Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messages}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            ListHeaderComponent={
              <Text variant="small" color="textMuted" center style={styles.notice}>
                Private live chat. Text and photos only. Deleted 24 hours after the request.
              </Text>
            }
            ListEmptyComponent={
              <Text variant="body" color="textSecondary" center style={styles.empty}>
                {isPandit ? 'You accepted the request. Write your reply.' : `The ${noun} has joined. Send a text or a photo.`}
              </Text>
            }
            renderItem={({ item }) => <Bubble message={item} mine={item.from === mine} />}
          />

          {phase === 'live' ? (
            <>
            <AccessBanner
              access={access}
              now={now}
              isPandit={isPandit}
              paywallOpen={showPaywall}
              onTogglePaywall={() => setShowPaywall((open) => !open)}
            />
            {!isPandit && user && (locked || (showPaywall && access.kind !== 'pass')) ? (
              <View
                style={[
                  styles.paywallWrap,
                  { borderTopColor: theme.colors.border, paddingBottom: locked ? insets.bottom + 12 : 10 },
                ]}>
                <PassPaywall headline={locked ? 'YOUR 2 FREE MINUTES ARE OVER' : 'CONTINUE WITHOUT LIMITS'} />
              </View>
            ) : null}
            {locked ? null : (
            <View
              style={[
                styles.inputBar,
                {
                  backgroundColor: theme.colors.surface,
                  borderTopColor: theme.colors.border,
                  paddingBottom: insets.bottom + 10,
                },
              ]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Send a photo"
                onPress={() => void sendPhoto()}
                style={[styles.photoBtn, { borderColor: theme.colors.border }]}>
                <Ionicons name="image-outline" size={22} color={theme.colors.accentGold} />
              </Pressable>
              <View
                style={[
                  styles.inputField,
                  { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border },
                ]}>
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="Write a message"
                  placeholderTextColor={theme.colors.textMuted}
                  style={[styles.input, { color: theme.colors.text }]}
                  maxLength={2000}
                  multiline
                />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Send message"
                onPress={sendText}
                style={[styles.sendBtn, { backgroundColor: theme.colors.accentGold }]}>
                <Ionicons name="send" size={18} color="#1A140C" />
              </Pressable>
            </View>
            )}
            </>
          ) : (
            <View
              style={[
                styles.endedBar,
                { borderTopColor: theme.colors.border, paddingBottom: insets.bottom + 12 },
              ]}>
              <Text variant="caption" color="textMuted" center>
                This chat has ended.
              </Text>
              {canRequest ? (
                <Button
                  label="Start a new chat"
                  variant="gold"
                  loading={busy}
                  disabled={!desk || desk.online === false}
                  onPress={onRequest}
                />
              ) : null}
            </View>
          )}
        </KeyboardAvoidingView>
      )}
    </Screen>
  );
}

function PriceLine({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.priceLine}>
      <Ionicons name={icon} size={16} color="#E8C47A" />
      <Text variant="small" color="textSecondary" style={styles.flex}>
        {text}
      </Text>
    </View>
  );
}

type AccessBannerProps = {
  access: ChatAccess;
  now: number;
  isPandit: boolean;
  paywallOpen: boolean;
  onTogglePaywall: () => void;
};

function AccessBanner({ access, now, isPandit, paywallOpen, onTogglePaywall }: AccessBannerProps) {
  const label =
    access.kind === 'pass'
      ? `${isPandit ? 'Customer has a 24-hour pass' : '24-hour pass active'} · ${formatRemaining(access.until - now)} left`
      : access.kind === 'free'
        ? `Free time · ${formatClock(access.until - now)} left`
        : isPandit
          ? 'Free time over · waiting for the customer to pay'
          : 'Free time over';

  return (
    <View style={[styles.banner, access.kind === 'pass' ? styles.bannerPass : null]}>
      <Ionicons
        name={access.kind === 'pass' ? 'shield-checkmark' : 'time-outline'}
        size={15}
        color={access.kind === 'pass' ? '#5EE2A0' : '#E8C47A'}
      />
      <Text variant="small" weight="600" style={styles.bannerText} numberOfLines={1}>
        {label}
      </Text>
      {!isPandit && access.kind === 'free' ? (
        <Pressable accessibilityRole="button" onPress={onTogglePaywall} hitSlop={8}>
          <Text variant="small" weight="700" color="accentGold">
            {paywallOpen ? 'Hide' : `Get pass ₹${PASS_PRICE}`}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function Bubble({ message, mine }: { message: LiveMessage; mine: boolean }) {
  const theme = useAppTheme();
  return (
    <View style={[styles.bubbleRow, mine ? styles.bubbleRight : styles.bubbleLeft]}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: mine ? theme.colors.primary : theme.colors.surfaceAlt,
            borderColor: theme.colors.border,
            borderBottomRightRadius: mine ? 4 : 18,
            borderBottomLeftRadius: mine ? 18 : 4,
          },
        ]}>
        {message.kind === 'photo' && message.image ? (
          <Image source={{ uri: message.image }} style={styles.photo} contentFit="cover" cachePolicy="memory" />
        ) : null}
        {message.text ? (
          <Text variant="body" style={{ color: mine ? '#FFFFFF' : theme.colors.text }}>
            {message.text}
          </Text>
        ) : null}
        <Text
          variant="tiny"
          style={{ color: mine ? 'rgba(255,255,255,0.7)' : theme.colors.textMuted, marginTop: 4 }}>
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  gate: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, gap: 12 },
  eyebrow: { color: '#E8C47A', fontSize: 11, fontWeight: '700', letterSpacing: 2.4 },
  messages: { padding: 16, gap: 10, flexGrow: 1 },
  notice: { marginBottom: 8 },
  empty: { marginTop: 24 },
  bubbleRow: { flexDirection: 'row' },
  bubbleLeft: { justifyContent: 'flex-start' },
  bubbleRight: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  photo: { width: 220, height: 220, borderRadius: 12 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  endedBar: { gap: 10, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  pricing: { gap: 8, padding: 14, borderRadius: 16, borderWidth: 1, marginVertical: 4 },
  priceLine: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(232,196,122,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(232,196,122,0.28)',
  },
  bannerPass: { backgroundColor: 'rgba(94,226,160,0.08)', borderColor: 'rgba(94,226,160,0.3)' },
  bannerText: { flex: 1, color: '#F3EFFF' },
  paywallWrap: { paddingHorizontal: 16, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  photoBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputField: {
    flex: 1,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 120,
  },
  input: { fontSize: 15, minHeight: 24 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
