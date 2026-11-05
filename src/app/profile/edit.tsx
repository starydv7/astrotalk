import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { authMessage } from '@/auth/auth-errors';
import { useAuth } from '@/auth/auth-provider';
import { FormNotice } from '@/components/auth/form-notice';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Screen } from '@/components/ui/screen';
import { SubHeader } from '@/components/ui/sub-header';
import { Text } from '@/components/ui/text';
import { useAppTheme } from '@/theme/theme-provider';

const TOPICS = ['Love', 'Career', 'Finance', 'Health', 'Marriage', 'Spirituality'];

export default function EditProfileScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile, displayName, saveProfile } = useAuth();

  const [name, setName] = useState(profile.name || displayName);
  const [phone, setPhone] = useState(profile.phone);
  const [bio, setBio] = useState(profile.bio);
  const [topics, setTopics] = useState<string[]>(profile.topics);
  const [nameError, setNameError] = useState<string>();
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  function toggleTopic(t: string) {
    setTopics((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  async function save() {
    if (name.trim().length < 2) {
      setNameError('Enter your name');
      return;
    }
    setNameError(undefined);
    setFormError('');
    setSaving(true);
    try {
      await saveProfile({ name, phone: phone.trim(), bio: bio.trim(), topics });
      router.back();
    } catch (error) {
      setFormError(authMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen edges={['top']}>
      <SubHeader title="Edit Profile" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.avatarWrap}>
            <Avatar uri={user?.photoURL} name={name} size={96} ring />
            <Text variant="caption" color="textMuted" center>
              {user?.email}
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Full name"
              icon="person"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              error={nameError}
            />
            <Input
              label="Phone"
              icon="call"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="Optional"
            />
            <Input
              label="About you"
              icon="document-text"
              value={bio}
              onChangeText={setBio}
              placeholder="A line for your guide (optional)"
              multiline
              style={{ height: 80, textAlignVertical: 'top' }}
            />
          </View>

          <View style={styles.topicsBlock}>
            <Text variant="caption" color="textSecondary" style={styles.topicsLabel}>
              Guidance interests
            </Text>
            <View style={styles.topics}>
              {TOPICS.map((t) => {
                const active = topics.includes(t);
                return (
                  <Pressable
                    key={t}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => toggleTopic(t)}
                    style={[
                      styles.topic,
                      {
                        backgroundColor: active ? theme.colors.accentGold : theme.colors.surfaceAlt,
                        borderColor: active ? theme.colors.accentGold : theme.colors.border,
                      },
                    ]}>
                    <Text variant="caption" style={{ color: active ? '#1A140C' : theme.colors.textSecondary }}>
                      {t}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {formError ? <FormNotice message={formError} /> : null}

          <Button label="Save Changes" variant="gold" size="lg" loading={saving} onPress={save} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 20, gap: 24 },
  avatarWrap: { alignItems: 'center', gap: 10, marginTop: 8 },
  form: { gap: 16 },
  topicsBlock: { gap: 10 },
  topicsLabel: { marginLeft: 4 },
  topics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  topic: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
});
