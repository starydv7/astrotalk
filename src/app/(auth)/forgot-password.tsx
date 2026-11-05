import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

import { authMessage } from '@/auth/auth-errors';
import { useAuth } from '@/auth/auth-provider';
import { FormNotice } from '@/components/auth/form-notice';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { useAppTheme } from '@/theme/theme-provider';
import { isValidEmail } from '@/utils/validation';

export default function ForgotPasswordScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();
  const [formError, setFormError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (!isValidEmail(email)) {
      setError('Enter a valid email address');
      return;
    }
    setError(undefined);
    setFormError('');
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setFormError(authMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen gradient edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          <BackButton />

          {sent ? (
            <View style={styles.centerBlock}>
              <View style={[styles.iconWrap, { backgroundColor: theme.colors.accentGoldSoft }]}>
                <Ionicons name="mail-open" size={40} color={theme.colors.accentGold} />
              </View>
              <Text variant="h1" center>
                Check your email
              </Text>
              <Text variant="body" color="textSecondary" center>
                If an account exists for {email}, a reset link is on its way. Check spam if it does not arrive.
              </Text>
              <Button
                label="Back to Sign In"
                variant="gold"
                size="lg"
                style={styles.cta}
                onPress={() => router.replace('/(auth)/login')}
              />
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <Text variant="h1">Reset password</Text>
                <Text variant="body" color="textSecondary">
                  Enter your account email and we will send you a reset link.
                </Text>
              </View>
              <Input
                label="Email"
                icon="mail"
                placeholder="you@example.com"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                error={error}
              />
              {formError ? <FormNotice message={formError} /> : null}
              <Button
                label="Send reset link"
                variant="gold"
                size="lg"
                loading={loading}
                onPress={onSubmit}
              />
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flex: 1, padding: 24, gap: 24 },
  header: { gap: 8, marginTop: 8 },
  centerBlock: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cta: { marginTop: 16, alignSelf: 'stretch' },
});
