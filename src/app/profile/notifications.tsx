import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { SubHeader } from '@/components/ui/sub-header';
import { ToggleRow } from '@/components/ui/toggle-row';
import { useAppTheme } from '@/theme/theme-provider';

export default function NotificationsScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  const [chat, setChat] = useState(true);
  const [promos, setPromos] = useState(false);
  const [daily, setDaily] = useState(true);

  return (
    <Screen edges={['top']}>
      <SubHeader title="Notifications" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <Card padded={false}>
          <ToggleRow
            icon="chatbubble-ellipses"
            label="Chat & call alerts"
            description="Replies and incoming calls from astrologers."
            value={chat}
            onValueChange={setChat}
          />
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <ToggleRow
            icon="sunny"
            label="Daily insight"
            description="A gentle daily reflection."
            value={daily}
            onValueChange={setDaily}
          />
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <ToggleRow
            icon="pricetag"
            label="Offers & promotions"
            value={promos}
            onValueChange={setPromos}
          />
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 64 },
});
