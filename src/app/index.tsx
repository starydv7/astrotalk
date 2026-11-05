import { Redirect } from 'expo-router';

import { useAuth } from '@/auth/auth-provider';

export default function Index() {
  const { user, verified } = useAuth();

  if (!user) return <Redirect href="/(auth)/welcome" />;
  if (!verified) return <Redirect href="/verify-email" />;
  return <Redirect href="/(tabs)" />;
}
