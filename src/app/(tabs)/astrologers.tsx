import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AstrologerCard } from '@/components/astrology/astrologer-card';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { SearchBar } from '@/components/ui/search-bar';
import { Text } from '@/components/ui/text';
import { EmptyState } from '@/components/ui/empty-state';
import { ASTROLOGERS } from '@/data/astrologers';
import type { Astrologer } from '@/types/domain';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'online', label: 'Online' },
  { id: 'love', label: 'Love' },
  { id: 'career', label: 'Career' },
  { id: 'finance', label: 'Finance' },
] as const;

type FilterId = (typeof FILTERS)[number]['id'];

export default function AstrologersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterId>('all');

  const data = useMemo<Astrologer[]>(() => {
    return ASTROLOGERS.filter((a) => {
      const matchesQuery =
        query.trim().length === 0 ||
        a.name.toLowerCase().includes(query.toLowerCase()) ||
        a.specialty.toLowerCase().includes(query.toLowerCase());
      const matchesFilter =
        filter === 'all'
          ? true
          : filter === 'online'
            ? a.online
            : a.skills.includes(filter);
      return matchesQuery && matchesFilter;
    });
  }, [query, filter]);

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="h2">Astrologers</Text>
      </View>
      <View style={styles.searchWrap}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search astrologers..." />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}>
        {FILTERS.map((f) => (
          <Chip
            key={f.id}
            label={f.label}
            active={filter === f.id}
            onPress={() => setFilter(f.id)}
          />
        ))}
      </ScrollView>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <EmptyState
            icon="search"
            title="No astrologers found"
            message="Try a different search or filter."
          />
        }
        renderItem={({ item }) => (
          <AstrologerCard astrologer={item} onPress={() => router.push(`/astrologer/${item.id}`)} />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 8 },
  searchWrap: { paddingHorizontal: 20, marginTop: 12 },
  filters: { paddingHorizontal: 20, paddingVertical: 16, gap: 8 },
  list: { paddingHorizontal: 20 },
});
