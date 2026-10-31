import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { SubHeader } from '@/components/ui/sub-header';
import { Text } from '@/components/ui/text';
import { useAppTheme } from '@/theme/theme-provider';

const FAQS = [
  { q: 'How do consultations work?', a: 'Pick an astrologer and start a chat, voice or video session. You are charged per minute from your wallet balance.' },
  { q: 'Is my conversation private?', a: 'Yes. You control what is saved in Privacy & Security, and you can delete your data anytime.' },
  { q: 'How do I add money?', a: 'Open Wallet & Payments and choose a top-up amount. Card details are never stored on your device.' },
];

export default function SupportScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <Screen edges={['top']}>
      <SubHeader title="Help & Support" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}>
        <Card onPress={() => {}} style={styles.contact}>
          <View style={[styles.contactIcon, { backgroundColor: theme.colors.primarySoft }]}>
            <Ionicons name="chatbubbles" size={22} color={theme.colors.primary} />
          </View>
          <View style={styles.contactText}>
            <Text variant="bodyStrong">Chat with support</Text>
            <Text variant="small" color="textMuted">
              Typically replies within a few minutes
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
        </Card>

        <Text variant="caption" color="textMuted" style={styles.section}>
          Frequently asked
        </Text>
        {FAQS.map((f) => (
          <Card key={f.q} style={styles.faq}>
            <Text variant="bodyStrong">{f.q}</Text>
            <Text variant="caption" color="textSecondary">
              {f.a}
            </Text>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 12 },
  contact: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  contactIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  contactText: { flex: 1, gap: 2 },
  section: { marginTop: 10, marginLeft: 4 },
  faq: { gap: 6 },
});
