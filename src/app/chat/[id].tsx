import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { BackButton } from '@/components/ui/back-button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { getAstrologer, SAMPLE_CHAT } from '@/data/astrologers';
import { useAppTheme } from '@/theme/theme-provider';
import type { ChatMessage } from '@/types/domain';

export default function ChatScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const astrologer = getAstrologer(String(id));

  const [messages, setMessages] = useState<ChatMessage[]>(SAMPLE_CHAT);
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<ChatMessage>>(null);

  function send() {
    const text = draft.trim();
    if (!text) return;
    const msg: ChatMessage = {
      id: `m${Date.now()}`,
      role: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, msg]);
    setDraft('');
    // Backend integration point: POST /v1/conversations/:id/messages (or /stream).
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `a${Date.now()}`,
          role: 'astrologer',
          text: 'Thank you for sharing. Let me look into this and guide you step by step.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 900);
  }

  return (
    <Screen edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <BackButton />
        <Pressable
          accessibilityRole="button"
          style={styles.headerInfo}
          onPress={() => astrologer && router.push(`/astrologer/${astrologer.id}`)}>
          <Avatar uri={astrologer?.avatarUrl} name={astrologer?.name} size={40} online={astrologer?.online} />
          <View>
            <Text variant="bodyStrong" numberOfLines={1}>
              {astrologer?.name ?? 'Astrologer'}
            </Text>
            <Text variant="small" color={astrologer?.online ? 'success' : 'textMuted'}>
              {astrologer?.online ? 'Online' : 'Offline'}
            </Text>
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Start voice call"
          hitSlop={8}
          onPress={() => astrologer && router.push(`/call/${astrologer.id}`)}
          style={[styles.callBtn, { backgroundColor: theme.colors.primarySoft }]}>
          <Ionicons name="call" size={18} color={theme.colors.primary} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.messages}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => <Bubble message={item} />}
        />

        {/* Input bar */}
        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
              paddingBottom: insets.bottom + 10,
            },
          ]}>
          <View
            style={[
              styles.inputField,
              { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border },
            ]}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Type your message..."
              placeholderTextColor={theme.colors.textMuted}
              style={[styles.input, { color: theme.colors.text }]}
              multiline
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send message"
            onPress={send}
            style={[styles.sendBtn, { backgroundColor: theme.colors.primary }]}>
            <Ionicons name="send" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const theme = useAppTheme();
  const isUser = message.role === 'user';
  return (
    <View style={[styles.bubbleRow, isUser ? styles.bubbleRight : styles.bubbleLeft]}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isUser ? theme.colors.primary : theme.colors.surfaceAlt,
            borderColor: theme.colors.border,
            borderBottomRightRadius: isUser ? 4 : 18,
            borderBottomLeftRadius: isUser ? 18 : 4,
          },
        ]}>
        <Text variant="body" style={{ color: isUser ? '#FFFFFF' : theme.colors.text }}>
          {message.text}
        </Text>
        <Text
          variant="tiny"
          style={{ color: isUser ? 'rgba(255,255,255,0.7)' : theme.colors.textMuted, marginTop: 4 }}>
          {message.time}
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
  callBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  messages: { padding: 16, gap: 10 },
  bubbleRow: { flexDirection: 'row' },
  bubbleLeft: { justifyContent: 'flex-start' },
  bubbleRight: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
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
