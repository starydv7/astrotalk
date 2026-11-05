import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
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
import { useAppTheme } from '@/theme/theme-provider';
import { checkPassword, isValidEmail, passwordStrength } from '@/utils/validation';

export default function RegisterScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { configured, register, signInGoogle } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const strength = useMemo(() => passwordStrength(password), [password]);
  const strengthLabel = ['Too weak', 'Weak', 'Good', 'Strong'][strength];
  const strengthColor = [theme.colors.danger, theme.colors.warning, theme.colors.info, theme.colors.success][
    strength
  ];

  function validate() {
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = 'Enter your name';
    if (!isValidEmail(email)) next.email = 'Enter a valid email address';
    const pw = checkPassword(password);
    if (!pw.valid) next.password = pw.message;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit() {
    if (!validate()) return;
    setFormError('');
    setLoading(true);
    try {
      await register(name, email, password);
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
              Create your account
            </Text>
            <Text variant="body" color="textSecondary">
              One account for your chats, your chart, and your guides.
            </Text>
          </View>

          {!configured ? (
            <FormNotice
              tone="info"
              message="Sign-up is not connected yet. Add the Firebase keys to the app settings to turn it on."
            />
          ) : null}

          <SocialButtons onGoogle={onGoogle} loading={googleLoading} disabled={busy || !configured} />

          <AuthDivider label="or sign up with email" />

          <View style={styles.form}>
            <Input
              label="Full name"
              icon="person"
              placeholder="Your name"
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              value={name}
              onChangeText={setName}
              error={errors.name}
            />
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
              placeholder="At least 10 characters"
              secure
              autoComplete="password-new"
              textContentType="newPassword"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
            />

            {password.length > 0 ? (
              <View style={styles.strengthRow}>
                <View style={styles.strengthBars}>
                  {[0, 1, 2].map((i) => (
                    <View
                      key={i}
                      style={[
                        styles.strengthBar,
                        { backgroundColor: i < strength ? strengthColor : theme.colors.surfaceElevated },
                      ]}
                    />
                  ))}
                </View>
                <Text variant="small" style={{ color: strengthColor }}>
                  {strengthLabel}
                </Text>
              </View>
            ) : null}

            {formError ? <FormNotice message={formError} /> : null}

            <Button
              label="Create Account"
              variant="gold"
              size="lg"
              loading={loading}
              disabled={busy || !configured}
              onPress={onSubmit}
            />

            <Text variant="small" color="textMuted" center>
              We will email you a link to confirm your address.
            </Text>
          </View>

          <View style={styles.footer}>
            <Text variant="caption" color="textSecondary">
              Already have an account?{' '}
            </Text>
            <Pressable accessibilityRole="button" onPress={() => router.replace('/(auth)/login')} hitSlop={8}>
              <Text variant="caption" color="accentGold" weight="700">
                Sign In
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
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: -6 },
  strengthBars: { flexDirection: 'row', gap: 6, flex: 1 },
  strengthBar: { flex: 1, height: 5, borderRadius: 3 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 4 },
});
