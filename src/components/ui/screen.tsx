import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

import { CosmicBackdrop } from '@/components/brand/cosmic-backdrop';
import { useAppTheme } from '@/theme/theme-provider';

type ScreenProps = {
  children: ReactNode;
  /** Richer violet wash for welcome-adjacent and ritual screens. */
  gradient?: boolean;
  rich?: boolean;
  edges?: Edge[];
  padded?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
};

export function Screen({
  children,
  gradient = false,
  rich = false,
  edges = ['top', 'left', 'right'],
  padded = false,
  style,
  contentStyle,
}: ScreenProps) {
  const theme = useAppTheme();

  return (
    <View style={[styles.flex, style]}>
      <StatusBar style="light" />
      <CosmicBackdrop rich={gradient || rich} />
      <SafeAreaView edges={edges} style={[styles.flex, contentStyle]}>
        <View style={[styles.flex, padded ? { padding: theme.spacing.xl } : null]}>{children}</View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
