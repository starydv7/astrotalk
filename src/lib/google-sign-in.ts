import { GoogleAuthProvider, signInWithCredential, type Auth } from 'firebase/auth';

import { AuthMessage } from '@/auth/auth-errors';

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

type GoogleModule = typeof import('@react-native-google-signin/google-signin');

let configured = false;

async function loadGoogle(): Promise<GoogleModule | null> {
  try {
    const mod = await import('@react-native-google-signin/google-signin');
    if (!configured) {
      mod.GoogleSignin.configure({ webClientId, iosClientId });
      configured = true;
    }
    return mod;
  } catch {
    // The native module is absent in Expo Go; it ships in development and store builds.
    return null;
  }
}

export async function signInWithGoogle(auth: Auth): Promise<'ok' | 'cancelled'> {
  if (!webClientId) {
    throw new AuthMessage('Google sign-in is not connected yet. Add the Google web client ID to the app settings.');
  }
  const google = await loadGoogle();
  if (!google) {
    throw new AuthMessage('Google sign-in works in the installed AstroTalk app. Use email here, or open a development build.');
  }
  const { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } = google;

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) return 'cancelled';
    const idToken = response.data.idToken;
    if (!idToken) {
      throw new AuthMessage('Google did not return an ID token. Check that the web client ID belongs to this Firebase project.');
    }
    await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
    return 'ok';
  } catch (error) {
    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.IN_PROGRESS) return 'cancelled';
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new AuthMessage('Google Play services are unavailable on this device.');
      }
      if (String(error.code) === '10' || String(error.code) === 'DEVELOPER_ERROR') {
        throw new AuthMessage(
          'Google sign-in is not set up for this app build (code 10). Add this build’s SHA-1 to the com.starydv7.astrotalk Android app in Firebase.',
        );
      }
    }
    throw error;
  }
}

export async function signOutOfGoogle() {
  const google = await loadGoogle();
  try {
    await google?.GoogleSignin.signOut();
  } catch {
    // Not signed in with Google on this device.
  }
}
