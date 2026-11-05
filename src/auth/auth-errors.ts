/** An error whose message is already written for the person using the app. */
export class AuthMessage extends Error {}

const MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'That email and password do not match an account.',
  'auth/invalid-login-credentials': 'That email and password do not match an account.',
  'auth/wrong-password': 'That email and password do not match an account.',
  'auth/user-not-found': 'That email and password do not match an account.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/email-already-in-use': 'An account already uses this email. Sign in instead.',
  'auth/weak-password': 'Choose a stronger password.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/too-many-requests': 'Too many attempts. Wait a moment, then try again.',
  'auth/network-request-failed': 'No connection. Check your internet and try again.',
  'auth/requires-recent-login': 'For your safety, sign out and sign in again, then retry.',
  'auth/account-exists-with-different-credential':
    'This email already has an account with another sign-in method. Use that method.',
  'auth/operation-not-allowed': 'This sign-in method is not turned on in Firebase yet.',
  'auth/popup-blocked': 'Allow pop-ups for this site, then try Google again.',
  'auth/configuration-not-found': 'Google sign-in is not turned on in Firebase Authentication yet.',
};

export function authMessage(error: unknown): string {
  if (error instanceof AuthMessage) return error.message;
  const code = (error as { code?: string } | null)?.code;
  if (code && MESSAGES[code]) return MESSAGES[code];
  return code
    ? `Something went wrong (${code}). Please try again.`
    : 'Something went wrong. Please try again.';
}
