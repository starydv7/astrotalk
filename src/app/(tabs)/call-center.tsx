import { Redirect } from 'expo-router';

/**
 * Placeholder route backing the center "Ask" tab button.
 * The tab button itself opens the chats tab; if this route is ever
 * reached directly, send the user to the astrologers list.
 */
export default function AskCenter() {
  return <Redirect href="/(tabs)/astrologers" />;
}
