import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/theme/theme-provider';

type ScreenProps = {
  children: ReactNode;
  /** Use the midnight gradient background (hero/auth screens). */
  gradient?: boolean;
  edges?: Edge[];
  padded?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
};

export function Screen({
  children,
  gradient = false,
  edges = ['top', 'left', 'right'],
  padded = false,
  style,
  contentStyle,
}: ScreenProps) {
  const theme = useAppTheme();

  const content = (
    <SafeAreaView edges={edges} style={[styles.flex, contentStyle]}>
      <View style={[styles.flex, padded ? { padding: theme.spacing.xl } : null]}>{children}</View>
    </SafeAreaView>
  );

  if (gradient) {
    return (
      <LinearGradient colors={theme.gradients.night} style={[styles.flex, style]}>
        <StatusBar style="light" />
        {content}
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }, style]}>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
