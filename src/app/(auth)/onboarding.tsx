import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { useAppTheme } from '@/theme/theme-provider';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    icon: 'chatbubbles' as const,
    title: 'Talk to real astrologers',
    body: 'Request a live chat with a guide. You can send text and a photo, and the conversation is deleted after 24 hours.',
  },
  {
    icon: 'sparkles' as const,
    title: 'Personalized guidance',
    body: 'Get practical, step-by-step guidance for love, career, finance, health and life decisions.',
  },
  {
    icon: 'shield-checkmark' as const,
    title: 'Private & secure',
    body: 'Your conversations and birth details stay private. You control what is saved.',
  },
];

export default function OnboardingScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const onViewable = useCallback((info: { viewableItems: { index?: number | null }[] }) => {
    const first = info.viewableItems[0];
    if (first?.index != null) setIndex(first.index);
  }, []);

  function next() {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1 });
    } else {
      router.replace('/(auth)/register');
    }
  }

  return (
    <Screen gradient edges={['top', 'bottom']}>
      <View style={styles.skipRow}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/(auth)/register')}
          hitSlop={8}>
          <Text variant="caption" color="textSecondary">
            Skip
          </Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.title}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <LinearGradient colors={theme.gradients.violet} style={styles.iconWrap}>
              <Ionicons name={item.icon} size={56} color="#FFFFFF" />
            </LinearGradient>
            <Text variant="h1" center style={styles.slideTitle}>
              {item.title}
            </Text>
            <Text variant="body" color="textSecondary" center style={styles.slideBody}>
              {item.body}
            </Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  width: i === index ? 24 : 8,
                  backgroundColor: i === index ? theme.colors.accentGold : theme.colors.borderStrong,
                },
              ]}
            />
          ))}
        </View>
        <Button
          label={index === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          variant="gold"
          size="lg"
          iconRight="arrow-forward"
          onPress={next}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  skipRow: { alignItems: 'flex-end', paddingHorizontal: 24, paddingTop: 8 },
  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 16 },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  slideTitle: { marginTop: 8 },
  slideBody: { paddingHorizontal: 8 },
  footer: { paddingHorizontal: 24, paddingBottom: 12, gap: 20 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { height: 8, borderRadius: 4 },
});
