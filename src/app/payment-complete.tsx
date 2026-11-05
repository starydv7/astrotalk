import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/ui/screen';

/** Landing spot for the Razorpay checkout deep link; the chat screen handles the result. */
export default function PaymentCompleteScreen() {
  const router = useRouter();

  useEffect(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/chats');
  }, [router]);

  return (
    <Screen>
      <View style={styles.center}>
        <ActivityIndicator color="#E8C47A" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
