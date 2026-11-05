import { Redirect } from 'expo-router';

/** The live line is a text-and-photo chat, opened from the Chats tab. */
export default function LiveLineScreen() {
  return <Redirect href="/(tabs)/chats" />;
}
