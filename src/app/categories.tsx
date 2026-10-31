import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryTile } from '@/components/astrology/category-tile';
import { BackButton } from '@/components/ui/back-button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { CATEGORIES } from '@/data/categories';

export default function CategoriesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Two-column grid, chunked into rows.
  const rows: (typeof CATEGORIES)[] = [];
  for (let i = 0; i < CATEGORIES.length; i += 2) {
    rows.push(CATEGORIES.slice(i, i + 2));
  }

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <BackButton />
        <Text variant="h3">Categories</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}>
        <Text variant="body" color="textMuted" style={styles.intro}>
          Choose a topic to find the right astrologer for your questions.
        </Text>
        {rows.map((row, idx) => (
          <View key={idx} style={styles.row}>
            {row.map((cat) => (
              <CategoryTile
                key={cat.id}
                category={cat}
                onPress={() => router.push('/(tabs)/astrologers')}
              />
            ))}
            {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  content: { paddingHorizontal: 20, paddingTop: 12, gap: 12 },
  intro: { marginBottom: 4 },
  row: { flexDirection: 'row', gap: 12 },
});
