import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { SubHeader } from '@/components/ui/sub-header';
import { Text } from '@/components/ui/text';
import { SIGNS, TONIGHT, signForToday } from '@/data/sky';
import { useAppTheme } from '@/theme/theme-provider';

export default function HoroscopeScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const today = useMemo(() => signForToday(), []);
  const [selectedId, setSelectedId] = useState(today.id);
  const selected = SIGNS.find((sign) => sign.id === selectedId) ?? today;

  return (
    <Screen rich edges={['top']}>
      <SubHeader title="Tonight's Sky" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}>
        <Text style={styles.eyebrow}>DAILY READING</Text>
        <Text variant="body" color="textSecondary">
          {TONIGHT.moon}. {TONIGHT.sky}
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.signs}>
          {SIGNS.map((sign) => {
            const active = sign.id === selected.id;
            return (
              <Pressable
                key={sign.id}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setSelectedId(sign.id)}
                style={[
                  styles.sign,
                  {
                    borderColor: active ? theme.colors.accentGold : theme.colors.border,
                    backgroundColor: active ? theme.colors.accentGoldSoft : theme.colors.surface,
                  },
                ]}>
                <Text style={styles.glyph}>{sign.glyph}</Text>
                <Text variant="small" style={{ color: active ? theme.colors.accentGold : theme.colors.textSecondary }}>
                  {sign.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View
          style={[
            styles.reading,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderStrong },
          ]}>
          <Text style={styles.glyphLarge}>{selected.glyph}</Text>
          <Text variant="h2" center>
            {selected.label}
          </Text>
          <Text variant="caption" color="textMuted" center>
            {selected.range}
          </Text>
          <View style={[styles.focus, { backgroundColor: theme.colors.accentGoldSoft }]}>
            <Text variant="tiny" style={{ color: '#1A140C' }}>
              {selected.focus.toUpperCase()}
            </Text>
          </View>
          <Text variant="body" color="textSecondary" center>
            {selected.line}
          </Text>
          {selected.id === today.id ? (
            <Text variant="small" color="accentGold" center>
              This is today’s sign
            </Text>
          ) : null}
        </View>

        <Button
          label="Ask a guide about this"
          variant="gold"
          iconRight="arrow-forward"
          onPress={() => router.push('/(tabs)/astrologers')}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 8, gap: 16 },
  eyebrow: { color: '#E8C47A', fontSize: 11, fontWeight: '700', letterSpacing: 2.4 },
  signs: { gap: 10, paddingVertical: 4 },
  sign: {
    width: 76,
    height: 84,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  glyph: { fontSize: 22, color: '#F6E7C1' },
  glyphLarge: { fontSize: 48, color: '#F6E7C1', textAlign: 'center' },
  reading: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
    alignItems: 'center',
    gap: 8,
  },
  focus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginVertical: 4 },
});
