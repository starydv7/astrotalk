import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/auth/auth-provider';
import { DialogProvider } from '@/components/ui/dialog-provider';
import { AppThemeProvider } from '@/theme/theme-provider';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppThemeProvider>
          <DialogProvider>
            <AuthProvider>
              <RootStack />
            </AuthProvider>
          </DialogProvider>
        </AppThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootStack() {
  const { initializing, user, verified } = useAuth();

  useEffect(() => {
    if (!initializing) void SplashScreen.hideAsync().catch(() => undefined);
  }, [initializing]);

  if (initializing) return null;

  const signedIn = !!user && verified;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 320,
        contentStyle: { backgroundColor: '#07060F' },
      }}>
      <Stack.Screen name="index" />

      <Stack.Protected guard={!user}>
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
      </Stack.Protected>

      <Stack.Protected guard={!!user && !verified}>
        <Stack.Screen name="verify-email" options={{ animation: 'fade' }} />
      </Stack.Protected>

      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="astrologer/[id]" />
        <Stack.Screen name="chat/[id]" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="reviews/[id]" />
        <Stack.Screen name="categories" />
        <Stack.Screen name="astrology/birth-details" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="horoscope" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="cleansing" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="payment-complete" options={{ animation: 'none' }} />
        <Stack.Screen name="live" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="premium" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="profile" />
      </Stack.Protected>
    </Stack>
  );
}
