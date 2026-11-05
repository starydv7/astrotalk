import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { useAppTheme } from '@/theme/theme-provider';

export default function VerifyEmailScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const [resent, setResent] = useState(false);

  return (
    <Screen gradient edges={['top', 'bottom']} padded>
      <View style={styles.center}>
        <View style={[styles.iconWrap, { backgroundColor: theme.colors.primarySoft }]}>
          <Ionicons name="mail-unread" size={44} color={theme.colors.primary} />
        </View>
        <Text variant="h1" center>
          Verify your email
        </Text>
        <Text variant="body" color="textSecondary" center style={styles.body}>
          We sent a verification link to your inbox. Open it to activate your account. You can
          continue exploring in the meantime.
        </Text>

        <Button
          label="Continue to AstroTalk"
          variant="gold"
          size="lg"
          style={styles.cta}
          onPress={() => router.replace('/(tabs)')}
        />
        <Button
          label={resent ? 'Verification email sent' : 'Resend email'}
          variant="ghost"
          onPress={() => setResent(true)}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  body: { paddingHorizontal: 8 },
  cta: { marginTop: 16, alignSelf: 'stretch' },
});
