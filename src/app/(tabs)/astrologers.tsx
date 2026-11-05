import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AstrologerCard } from '@/components/astrology/astrologer-card';
import { TraditionMark } from '@/components/astrology/tradition-mark';
import { Chip } from '@/components/ui/chip';
import { PageHeader } from '@/components/ui/page-header';
import { Screen } from '@/components/ui/screen';
import { SearchBar } from '@/components/ui/search-bar';
import { EmptyState } from '@/components/ui/empty-state';
import { ASTROLOGERS } from '@/data/astrologers';
import { useDesk } from '@/state/use-desk';
import type { Astrologer } from '@/types/domain';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'vedic', label: 'Pandits' },
  { id: 'islamic', label: 'Maulanas' },
  { id: 'protection', label: 'Protection' },
  { id: 'marriage', label: 'Marriage' },
  { id: 'career', label: 'Career' },
  { id: 'love', label: 'Love' },
] as const;

type FilterId = (typeof FILTERS)[number]['id'];

export default function AstrologersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterId>('all');

  const desk = useDesk();
  const online = desk?.online ?? true;

  const data = useMemo<Astrologer[]>(() => {
    return ASTROLOGERS.map((a) => ({ ...a, online })).filter((a) => {
      const matchesQuery =
        query.trim().length === 0 ||
        a.name.toLowerCase().includes(query.toLowerCase()) ||
        a.specialty.toLowerCase().includes(query.toLowerCase());
      const matchesFilter =
        filter === 'all'
          ? true
          : filter === 'vedic' || filter === 'islamic'
            ? a.tradition === filter
            : a.skills.includes(filter);
      return matchesQuery && matchesFilter;
    });
  }, [query, filter, online]);

  return (
    <Screen>
      <PageHeader
        eyebrow="THE CIRCLE"
        title="Our Experts"
        subtitle="Pandits and maulanas, one private chat away"
      />
      <View style={styles.searchWrap}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search pandits, maulanas, topics..." />
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
            leading={(color) => <TraditionMark tradition={f.id} size={13} color={color} />}
          />
        ))}
      </ScrollView>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <EmptyState
            icon="search"
            title="No experts found"
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
  searchWrap: { paddingHorizontal: 20, marginTop: 14 },
  filters: { paddingHorizontal: 20, paddingVertical: 16, gap: 8 },
  list: { paddingHorizontal: 20 },
});
