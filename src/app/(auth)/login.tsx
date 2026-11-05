import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { authMessage } from '@/auth/auth-errors';
import { useAuth } from '@/auth/auth-provider';
import { AuthDivider } from '@/components/auth/auth-divider';
import { FormNotice } from '@/components/auth/form-notice';
import { SocialButtons } from '@/components/auth/social-buttons';
import { Logo } from '@/components/brand/logo';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { isValidEmail } from '@/utils/validation';

export default function LoginScreen() {
  const router = useRouter();
  const { configured, signIn, signInGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  function validate() {
    const next: typeof errors = {};
    if (!isValidEmail(email)) next.email = 'Enter a valid email address';
    if (password.length < 1) next.password = 'Enter your password';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit() {
    if (!validate()) return;
    setFormError('');
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error) {
      setFormError(authMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle() {
    setFormError('');
    setGoogleLoading(true);
    try {
      await signInGoogle();
    } catch (error) {
      setFormError(authMessage(error));
    } finally {
      setGoogleLoading(false);
    }
  }

  const busy = loading || googleLoading;

  return (
    <Screen gradient edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <BackButton />

          <View style={styles.header}>
            <Logo size="md" />
            <Text variant="h1" style={styles.title}>
              Welcome back
            </Text>
            <Text variant="body" color="textSecondary">
              Sign in to return to your guides and your chart.
            </Text>
          </View>

          {!configured ? (
            <FormNotice
              tone="info"
              message="Sign-in is not connected yet. Add the Firebase keys to the app settings to turn it on."
            />
          ) : null}

          <SocialButtons onGoogle={onGoogle} loading={googleLoading} disabled={busy || !configured} />

          <AuthDivider label="or use email" />

          <View style={styles.form}>
            <Input
              label="Email"
              icon="mail"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
            />
            <Input
              label="Password"
              icon="lock-closed"
              placeholder="Your password"
              secure
              autoComplete="password"
              textContentType="password"
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={onSubmit}
              returnKeyType="go"
              error={errors.password}
            />

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/(auth)/forgot-password')}
              hitSlop={8}
              style={styles.forgot}>
              <Text variant="caption" color="accentGold" weight="700">
                Forgot password?
              </Text>
            </Pressable>

            {formError ? <FormNotice message={formError} /> : null}

            <Button
              label="Sign In"
              variant="gold"
              size="lg"
              loading={loading}
              disabled={busy || !configured}
              onPress={onSubmit}
            />
          </View>

          <View style={styles.footer}>
            <Text variant="caption" color="textSecondary">
              New to AstroTalk?{' '}
            </Text>
            <Pressable accessibilityRole="button" onPress={() => router.replace('/(auth)/register')} hitSlop={8}>
              <Text variant="caption" color="accentGold" weight="700">
                Create account
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 24, paddingBottom: 40, gap: 20 },
  header: { gap: 8, marginTop: 8 },
  title: { marginTop: 12 },
  form: { gap: 16 },
  forgot: { alignSelf: 'flex-end' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 4 },
});
