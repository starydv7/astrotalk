import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { SubHeader } from '@/components/ui/sub-header';
import { Text } from '@/components/ui/text';

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();

  return (
    <Screen edges={['top']}>
      <SubHeader title="Privacy & Security" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}>
        <Text variant="body" color="textSecondary">
          Live chat is temporary. A conversation is kept on this device for 24 hours from the request, then deleted.
        </Text>

        <Card>
          <Text variant="bodyStrong">What a chat can hold</Text>
          <Text variant="body" color="textSecondary" style={styles.gap}>
            Text and photos only. Voice, video, and other files are not part of a consultation.
          </Text>
        </Card>

        <Text variant="caption" color="textMuted">
          After 24 hours the thread is gone, including the photos that were sent in it.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 16 },
  gap: { marginTop: 8 },
});
