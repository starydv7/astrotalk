import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { authMessage } from '@/auth/auth-errors';
import { useAuth } from '@/auth/auth-provider';
import { FormNotice } from '@/components/auth/form-notice';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { useAppTheme } from '@/theme/theme-provider';

const RESEND_COOLDOWN_S = 60;

export default function VerifyEmailScreen() {
  const theme = useAppTheme();
  const { user, checkVerification, resendVerification, signOut } = useAuth();
  const [checking, setChecking] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_S);
  const [notice, setNotice] = useState<{ tone: 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function onCheck() {
    setChecking(true);
    setNotice(null);
    try {
      const ok = await checkVerification();
      if (!ok) setNotice({ tone: 'info', message: 'Not confirmed yet. Open the link in the email, then try again.' });
    } catch (error) {
      setNotice({ tone: 'error', message: authMessage(error) });
    } finally {
      setChecking(false);
    }
  }

  async function onResend() {
    setNotice(null);
    try {
      await resendVerification();
      setCooldown(RESEND_COOLDOWN_S);
      setNotice({ tone: 'info', message: 'A new link is on its way.' });
    } catch (error) {
      setNotice({ tone: 'error', message: authMessage(error) });
    }
  }

  return (
    <Screen gradient edges={['top', 'bottom']} padded>
      <View style={styles.center}>
        <View style={[styles.iconWrap, { backgroundColor: theme.colors.accentGoldSoft }]}>
          <Ionicons name="mail-unread" size={44} color={theme.colors.accentGold} />
        </View>
        <Text variant="h1" center>
          Confirm your email
        </Text>
        <Text variant="body" color="textSecondary" center style={styles.body}>
          We sent a link to {user?.email ?? 'your inbox'}. Open it, then come back here.
        </Text>

        {notice ? <FormNotice tone={notice.tone} message={notice.message} /> : null}

        <Button label="I have confirmed" variant="gold" size="lg" loading={checking} style={styles.cta} onPress={onCheck} />
        <Button
          label={cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend email'}
          variant="secondary"
          disabled={cooldown > 0}
          onPress={onResend}
        />
        <Button label="Use a different account" variant="ghost" onPress={() => void signOut()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', gap: 12 },
  iconWrap: {
    alignSelf: 'center',
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  body: { paddingHorizontal: 8 },
  cta: { marginTop: 12 },
});
