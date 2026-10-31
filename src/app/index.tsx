import { Redirect } from 'expo-router';

/**
 * App entry. For now we route to the onboarding/welcome screen.
 * Once auth session restore is wired, this becomes the gate that
 * redirects authenticated users straight to the tabs.
 */
export default function Index() {
  return <Redirect href="/(auth)/welcome" />;
}
