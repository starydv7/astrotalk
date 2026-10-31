import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { SubHeader } from '@/components/ui/sub-header';
import { Text } from '@/components/ui/text';
import { ToggleRow } from '@/components/ui/toggle-row';
import { useAppTheme } from '@/theme/theme-provider';

export default function PrivacyScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  const [saveHistory, setSaveHistory] = useState(true);
  const [personalization, setPersonalization] = useState(false);
  const [transcripts, setTranscripts] = useState(false);

  return (
    <Screen edges={['top']}>
      <SubHeader title="Privacy & Security" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}>
        <Text variant="body" color="textSecondary">
          You control what AstroTalk saves. Changes apply to future conversations.
        </Text>

        <Card padded={false}>
          <ToggleRow
            icon="save"
            label="Save conversation history"
            description="Keep your chats so you can revisit them later."
            value={saveHistory}
            onValueChange={setSaveHistory}
          />
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <ToggleRow
            icon="sparkles"
            label="Personalized memory"
            description="Let astrologers use saved preferences for better guidance."
            value={personalization}
            onValueChange={setPersonalization}
          />
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <ToggleRow
            icon="mic"
            label="Voice transcripts"
            description="Store transcripts of voice calls. Off by default."
            value={transcripts}
            onValueChange={setTranscripts}
          />
        </Card>

        <Text variant="caption" color="textMuted" style={styles.note}>
          You can export or delete your data anytime from Settings. Deleting your
          account removes all stored conversations and profile details.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 16 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 64 },
  note: { marginTop: 4 },
});
