import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Screen } from '@/components/ui/screen';
import { SubHeader } from '@/components/ui/sub-header';
import { Text } from '@/components/ui/text';
import { useAppTheme } from '@/theme/theme-provider';

const STORAGE_KEY = 'astrotalk.birth-details';

type BirthDetails = {
  name: string;
  date: string;
  time: string;
  place: string;
};

const EMPTY: BirthDetails = { name: '', date: '', time: '', place: '' };

export default function BirthDetailsScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<BirthDetails>(EMPTY);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const parsed = JSON.parse(raw) as BirthDetails;
        if (parsed?.name) {
          setForm(parsed);
          setSaved(true);
        }
      })
      .catch(() => undefined);
  }, []);

  function setField(key: keyof BirthDetails, value: string) {
    setSaved(false);
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSave() {
    if (!form.name.trim() || !form.date.trim() || !form.place.trim()) {
      setError('Name, birth date, and place are needed before a guide can read your chart.');
      return;
    }
    setError('');
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    setSaved(true);
  }

  return (
    <Screen rich edges={['top']}>
      <SubHeader title="Birth Chart" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}>
          <Text style={styles.eyebrow}>KUNDLI</Text>
          <Text variant="h2">Your sky, kept private</Text>
          <Text variant="body" color="textSecondary">
            These details travel with you into every consultation, so your guide starts from the right moment.
          </Text>

          <View style={styles.form}>
            <Input
              label="Full name"
              icon="person-outline"
              value={form.name}
              onChangeText={(value) => setField('name', value)}
              placeholder="As it should appear"
              autoCapitalize="words"
            />
            <Input
              label="Birth date"
              icon="calendar-outline"
              value={form.date}
              onChangeText={(value) => setField('date', value)}
              placeholder="DD / MM / YYYY"
            />
            <Input
              label="Birth time"
              icon="time-outline"
              value={form.time}
              onChangeText={(value) => setField('time', value)}
              placeholder="HH : MM, if you know it"
            />
            <Input
              label="Birth place"
              icon="location-outline"
              value={form.place}
              onChangeText={(value) => setField('place', value)}
              placeholder="City, country"
              autoCapitalize="words"
            />
          </View>

          {error ? (
            <Text variant="small" color="danger">
              {error}
            </Text>
          ) : null}

          {saved ? (
            <View style={[styles.saved, { borderColor: theme.colors.borderStrong, backgroundColor: theme.colors.surface }]}>
              <Text variant="bodyStrong" color="accentGold">
                Saved on this device
              </Text>
              <Text variant="caption" color="textSecondary">
                {form.name} · {form.date}
                {form.time ? ` · ${form.time}` : ''} · {form.place}
              </Text>
            </View>
          ) : null}

          <Button label={saved ? 'Update chart details' : 'Save chart details'} variant="gold" onPress={onSave} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8, gap: 12 },
  eyebrow: { color: '#E8C47A', fontSize: 11, fontWeight: '700', letterSpacing: 2.4 },
  form: { gap: 14, marginTop: 8 },
  saved: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 4 },
});
