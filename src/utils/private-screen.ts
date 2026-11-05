import * as ScreenCapture from 'expo-screen-capture';
import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Blocks screenshots and screen recording while the calling screen is mounted,
 * and blurs the app-switcher preview on iOS (Android gets this from FLAG_SECURE).
 */
export function usePrivateScreen(key = 'private-chat') {
  ScreenCapture.usePreventScreenCapture(key);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    void ScreenCapture.enableAppSwitcherProtectionAsync(0.9).catch(() => undefined);
    return () => {
      void ScreenCapture.disableAppSwitcherProtectionAsync().catch(() => undefined);
    };
  }, []);
}
