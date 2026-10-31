import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppThemeProvider } from '@/theme/theme-provider';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppThemeProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
              contentStyle: { backgroundColor: '#0A0B1E' },
            }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="astrologer/[id]" />
            <Stack.Screen name="chat/[id]" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen
              name="call/[id]"
              options={{ animation: 'fade', gestureEnabled: false }}
            />
            <Stack.Screen name="reviews/[id]" />
            <Stack.Screen name="categories" />
            <Stack.Screen name="premium" options={{ animation: 'slide_from_bottom' }} />
          </Stack>
        </AppThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
