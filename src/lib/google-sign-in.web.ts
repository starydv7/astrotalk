import { GoogleAuthProvider, signInWithPopup, type Auth } from 'firebase/auth';

export async function signInWithGoogle(auth: Auth): Promise<'ok' | 'cancelled'> {
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
    return 'ok';
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return 'cancelled';
    }
    throw error;
  }
}

export async function signOutOfGoogle() {}
