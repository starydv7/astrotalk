import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { SubHeader } from '@/components/ui/sub-header';
import { Text } from '@/components/ui/text';
import { ToggleRow } from '@/components/ui/toggle-row';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/theme/theme-provider';

export default function SettingsScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [sound, setSound] = useState(true);
  const [haptics, setHaptics] = useState(true);

  const links = [
    { label: 'Change password', route: '/profile/privacy' },
    { label: 'Privacy & security', route: '/profile/privacy' },
    { label: 'Help & support', route: '/profile/support' },
  ];

  return (
    <Screen edges={['top']}>
      <SubHeader title="Settings" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}>
        <Text variant="caption" color="textMuted" style={styles.section}>
          Preferences
        </Text>
        <Card padded={false}>
          <ToggleRow icon="volume-high" label="In-app sounds" value={sound} onValueChange={setSound} />
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <ToggleRow icon="phone-portrait" label="Haptic feedback" value={haptics} onValueChange={setHaptics} />
        </Card>

        <Text variant="caption" color="textMuted" style={styles.section}>
          Account
        </Text>
        <Card padded={false}>
          {links.map((l, i) => (
            <Pressable
              key={l.label}
              accessibilityRole="button"
              onPress={() => router.push(l.route as never)}
              style={({ pressed }) => [
                styles.link,
                i < links.length - 1
                  ? { borderBottomColor: theme.colors.border, borderBottomWidth: StyleSheet.hairlineWidth }
                  : null,
                pressed ? { opacity: 0.7 } : null,
              ]}>
              <Text variant="body">{l.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
            </Pressable>
          ))}
        </Card>

        <Pressable
          accessibilityRole="button"
          onPress={() =>
            Alert.alert('Delete account', 'This permanently removes your account and data.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive' },
            ])
          }
          style={styles.delete}>
          <Text variant="bodyStrong" color="danger">
            Delete account
          </Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 10 },
  section: { marginTop: 10, marginLeft: 4 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 64 },
  link: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  delete: { alignItems: 'center', paddingVertical: 20 },
});
