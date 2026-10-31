import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Screen } from '@/components/ui/screen';
import { SubHeader } from '@/components/ui/sub-header';
import { Text } from '@/components/ui/text';
import { DEMO_USER } from '@/data/profile';
import { useAppTheme } from '@/theme/theme-provider';

const TOPICS = ['Love', 'Career', 'Finance', 'Health', 'Marriage', 'Spirituality'];

export default function EditProfileScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState(DEMO_USER.name);
  const [email, setEmail] = useState(DEMO_USER.email ?? '');
  const [phone, setPhone] = useState(DEMO_USER.phone ?? '');
  const [bio, setBio] = useState('');
  const [topics, setTopics] = useState<string[]>(['Career', 'Finance']);
  const [saving, setSaving] = useState(false);

  function toggleTopic(t: string) {
    setTopics((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  function save() {
    setSaving(true);
    // Backend integration point: PATCH /v1/me/profile
    setTimeout(() => {
      setSaving(false);
      router.back();
    }, 700);
  }

  return (
    <Screen edges={['top']}>
      <SubHeader title="Edit Profile" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.avatarWrap}>
            <Avatar uri={DEMO_USER.avatarUrl} name={name} size={96} ring />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Change photo"
              style={[styles.cameraBtn, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </Pressable>
          </View>

          <View style={styles.form}>
            <Input label="Full name" icon="person" value={name} onChangeText={setName} />
            <Input
              label="Email"
              icon="mail"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <Input
              label="Phone"
              icon="call"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <Input
              label="About you"
              icon="document-text"
              value={bio}
              onChangeText={setBio}
              placeholder="Share a little about yourself (optional)"
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
                        backgroundColor: active ? theme.colors.primary : theme.colors.surfaceAlt,
                        borderColor: active ? theme.colors.primary : theme.colors.border,
                      },
                    ]}>
                    <Text
                      variant="caption"
                      style={{ color: active ? '#FFFFFF' : theme.colors.textSecondary }}>
                      {t}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Button label="Save Changes" variant="gold" size="lg" loading={saving} onPress={save} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 20, gap: 24 },
  avatarWrap: { alignSelf: 'center', marginTop: 8 },
  cameraBtn: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: { gap: 16 },
  topicsBlock: { gap: 10 },
  topicsLabel: { marginLeft: 4 },
  topics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  topic: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
});
