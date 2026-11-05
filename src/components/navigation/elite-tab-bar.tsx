import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs, useRouter } from 'expo-router';
import { useEffect, useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/ui/text';
import { tap } from '@/utils/haptics';

type EliteTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; idle: keyof typeof Ionicons.glyphMap }> = {
  index: { active: 'planet', idle: 'planet-outline' },
  chats: { active: 'chatbubbles', idle: 'chatbubbles-outline' },
  astrologers: { active: 'sparkles', idle: 'sparkles-outline' },
  profile: { active: 'person', idle: 'person-outline' },
};

export function EliteTabBar({ state, descriptors, navigateToTab, insets }: EliteTabBarProps) {
  const router = useRouter();
  const [barWidth, setBarWidth] = useState(0);
  const x = useSharedValue(0);
  const count = state.routes.length || 1;
  const slot = barWidth / count;

  useEffect(() => {
    if (barWidth <= 0) return;
    x.value = withSpring(state.index * slot, { damping: 18, stiffness: 180 });
  }, [barWidth, slot, state.index, x]);

  const pill = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value + 6 }],
  }));

  return (
    <View style={[styles.slot, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View
        style={styles.bar}
        onLayout={(event) => {
          setBarWidth(event.nativeEvent.layout.width);
        }}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.activePill,
            { width: Math.max(slot - 12, 0), opacity: state.index === 2 ? 0 : 1 },
            pill,
          ]}
        />
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key];
          const label = options.title && options.title.length > 0 ? options.title : 'Live';

          if (route.name === 'call-center') {
            return (
              <View key={route.key} style={styles.centerSlot}>
                <LiveOrb
                  onPress={() => {
                    tap(Haptics.ImpactFeedbackStyle.Medium);
                    router.push('/(tabs)/chats');
                  }}
                />
                <Text style={styles.label}>Ask</Text>
              </View>
            );
          }

          const icons = ICONS[route.name] ?? { active: 'ellipse', idle: 'ellipse-outline' };

          function onPress() {
            tap();
            if (!focused) navigateToTab(route.key);
          }

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              onPress={onPress}
              style={styles.tab}>
              <Ionicons
                name={focused ? icons.active : icons.idle}
                size={22}
                color={focused ? '#E8C47A' : '#8E93B5'}
              />
              <Text style={[styles.label, focused ? styles.labelOn : null]} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function LiveOrb({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(withTiming(1.18, { duration: 1400 }), -1, true);
  }, [scale]);

  const pulse = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: 1.35 - scale.value,
  }));

  return (
    <View style={styles.orbWrap}>
      <Animated.View pointerEvents="none" style={[styles.pulse, pulse]} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open the private line"
        onPress={onPress}
        style={({ pressed }) => [pressed ? { transform: [{ scale: 0.96 }] } : null]}>
        <LinearGradient colors={['#F6E7C1', '#E8C47A', '#C6A15A']} style={styles.orb}>
          <Ionicons name="chatbubble-ellipses" size={24} color="#1A140C" />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    backgroundColor: 'transparent',
    paddingHorizontal: 14,
    paddingTop: 28,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 66,
    borderRadius: 28,
    backgroundColor: 'rgba(16, 14, 28, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(232, 196, 122, 0.28)',
    overflow: 'visible',
    shadowColor: '#E8C47A',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  activePill: {
    position: 'absolute',
    left: 0,
    top: 8,
    height: 50,
    borderRadius: 18,
    backgroundColor: 'rgba(232, 196, 122, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(232, 196, 122, 0.28)',
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, height: 66 },
  label: { fontSize: 10, lineHeight: 12, fontWeight: '600', color: '#8E93B5' },
  labelOn: { color: '#E8C47A' },
  centerSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 66,
    paddingBottom: 8,
  },
  orbWrap: { position: 'absolute', top: -22, alignItems: 'center', justifyContent: 'center' },
  pulse: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#E8C47A',
  },
  orb: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#100E1C',
  },
});
