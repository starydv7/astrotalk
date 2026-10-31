import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { CONVERSATIONS } from '@/data/conversations';
import { useAppTheme } from '@/theme/theme-provider';

export default function ChatsScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="h2">Chats</Text>
        <Text variant="caption" color="textMuted">
          Your recent consultations
        </Text>
      </View>

      <FlatList
        data={CONVERSATIONS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => (
          <View style={[styles.sep, { backgroundColor: theme.colors.border }]} />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="chatbubbles-outline"
            title="No conversations yet"
            message="Start a chat with an astrologer to see it here."
            actionLabel="Browse astrologers"
            onAction={() => router.push('/(tabs)/astrologers')}
          />
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Chat with ${item.name}`}
            onPress={() => router.push(`/chat/${item.astrologerId}`)}
            style={({ pressed }) => [styles.row, pressed ? { opacity: 0.8 } : null]}>
            <Avatar uri={item.avatarUrl} name={item.name} size={52} online={item.online} />
            <View style={styles.info}>
              <View style={styles.topRow}>
                <Text variant="bodyStrong" numberOfLines={1}>
                  {item.name}
                </Text>
                <Text variant="small" color="textMuted">
                  {item.time}
                </Text>
              </View>
              <View style={styles.bottomRow}>
                <Text
                  variant="caption"
                  color={item.unread > 0 ? 'text' : 'textMuted'}
                  numberOfLines={1}
                  style={styles.preview}>
                  {item.lastMessage}
                </Text>
                {item.unread > 0 ? (
                  <View style={[styles.unread, { backgroundColor: theme.colors.accentGold }]}>
                    <Text variant="tiny" style={{ color: '#1A1206' }}>
                      {item.unread}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 8, gap: 2 },
  list: { paddingHorizontal: 20, paddingTop: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  info: { flex: 1, gap: 4 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  preview: { flex: 1 },
  unread: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sep: { height: StyleSheet.hairlineWidth, marginLeft: 64 },
});
