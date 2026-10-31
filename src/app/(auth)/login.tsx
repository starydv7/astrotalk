import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { SocialButtons } from '@/components/auth/social-buttons';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { AuthDivider } from '@/components/auth/auth-divider';
import { BackButton } from '@/components/ui/back-button';
import { isValidEmail } from '@/utils/validation';
import { useAppTheme } from '@/theme/theme-provider';

export default function LoginScreen() {
  const theme = useAppTheme();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null);

  function validate() {
    const next: typeof errors = {};
    if (!isValidEmail(email)) next.email = 'Enter a valid email address';
    if (password.length < 1) next.password = 'Enter your password';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit() {
    if (!validate()) return;
    setLoading(true);
    // Backend integration point: POST /v1/auth/login
    setTimeout(() => {
      setLoading(false);
      router.replace('/(tabs)');
    }, 700);
  }

  function onSocial(provider: 'google' | 'facebook') {
    setSocialLoading(provider);
    // Backend integration point: open GET /v1/auth/oauth/:provider/start in a
    // browser session, then exchange the returned code via POST /v1/auth/oauth/exchange.
    setTimeout(() => {
      setSocialLoading(null);
      Alert.alert(
        'Provider setup required',
        `${provider === 'google' ? 'Google' : 'Facebook'} sign-in needs OAuth credentials configured on the backend before it can complete.`,
      );
    }, 900);
  }

  return (
    <Screen gradient edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
              Sign in to continue your guidance journey.
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Email"
              icon="mail"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoComplete="email"
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
              value={password}
              onChangeText={setPassword}
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

            <Button label="Sign In" variant="gold" size="lg" loading={loading} onPress={onSubmit} />
          </View>

          <AuthDivider label="or continue with" />

          <SocialButtons onPress={onSocial} loadingProvider={socialLoading} />

          <View style={styles.footer}>
            <Text variant="caption" color="textSecondary">
              New to AstroTalk?{' '}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/(auth)/register')}
              hitSlop={8}>
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
