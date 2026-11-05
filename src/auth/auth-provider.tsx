import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { AuthMessage } from '@/auth/auth-errors';
import { auth, db, firebaseConfigured } from '@/lib/firebase';
import { signInWithGoogle, signOutOfGoogle } from '@/lib/google-sign-in';

export type Profile = {
  name: string;
  phone: string;
  bio: string;
  topics: string[];
};

const EMPTY_PROFILE: Profile = { name: '', phone: '', bio: '', topics: [] };

// Must match the email in firestore.rules.
const PANDIT_EMAILS = String(process.env.EXPO_PUBLIC_GUIDE_EMAILS || 'pawanstar72926@gmail.com')
  .split(',')
  .map((email: string) => email.trim().toLowerCase())
  .filter(Boolean);

type AuthContextValue = {
  configured: boolean;
  initializing: boolean;
  user: User | null;
  /** Email accounts must confirm their address; Google accounts arrive verified. */
  verified: boolean;
  profile: Profile;
  displayName: string;
  /** The pandit account answers every chat; everyone else is a customer. */
  isPandit: boolean;
  usesPassword: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<'ok' | 'cancelled'>;
  resetPassword: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  checkVerification: () => Promise<boolean>;
  saveProfile: (next: Partial<Profile>) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function requireAuth() {
  if (!auth) {
    throw new AuthMessage('Sign-in is not connected yet. Add the Firebase keys to the app settings.');
  }
  return auth;
}

function isVerified(user: User | null) {
  if (!user) return false;
  return user.emailVerified || user.providerData.some((p) => p.providerId !== 'password');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [verified, setVerified] = useState(false);
  const [initializing, setInitializing] = useState(firebaseConfigured);
  const [profileEntry, setProfileEntry] = useState<{ uid: string; value: Profile } | null>(null);
  const profile = user && profileEntry?.uid === user.uid ? profileEntry.value : EMPTY_PROFILE;

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (next) => {
      setUser(next);
      setVerified(isVerified(next));
      setInitializing(false);
    });
  }, []);

  useEffect(() => {
    if (!db || !user) return;
    const ref = doc(db, 'users', user.uid);
    const setProfile = (value: Profile) => setProfileEntry({ uid: user.uid, value });
    return onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          void setDoc(ref, {
            name: user.displayName ?? '',
            email: user.email ?? '',
            createdAt: serverTimestamp(),
          }).catch(() => undefined);
          setProfile({ ...EMPTY_PROFILE, name: user.displayName ?? '' });
          return;
        }
        const data = snap.data();
        setProfile({
          name: typeof data.name === 'string' ? data.name : '',
          phone: typeof data.phone === 'string' ? data.phone : '',
          bio: typeof data.bio === 'string' ? data.bio : '',
          topics: Array.isArray(data.topics) ? data.topics.filter((t): t is string => typeof t === 'string') : [],
        });
      },
      () => setProfile({ ...EMPTY_PROFILE, name: user.displayName ?? '' }),
    );
  }, [user]);

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(requireAuth(), email.trim(), password);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const credential = await createUserWithEmailAndPassword(requireAuth(), email.trim(), password);
    await updateProfile(credential.user, { displayName: name.trim() });
    if (db) {
      await setDoc(
        doc(db, 'users', credential.user.uid),
        { name: name.trim(), email: credential.user.email ?? '', createdAt: serverTimestamp() },
        { merge: true },
      ).catch(() => undefined);
    }
    await sendEmailVerification(credential.user);
  }, []);

  const signInGoogle = useCallback(() => signInWithGoogle(requireAuth()), []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(requireAuth(), email.trim());
    } catch (error) {
      if ((error as { code?: string }).code === 'auth/user-not-found') return;
      throw error;
    }
  }, []);

  const resendVerification = useCallback(async () => {
    const current = requireAuth().currentUser;
    if (current) await sendEmailVerification(current);
  }, []);

  const checkVerification = useCallback(async () => {
    const current = requireAuth().currentUser;
    if (!current) return false;
    await reload(current);
    const ok = isVerified(current);
    setVerified(ok);
    return ok;
  }, []);

  const saveProfile = useCallback(
    async (next: Partial<Profile>) => {
      const current = requireAuth().currentUser;
      if (!current) return;
      const name = next.name?.trim();
      if (name && name !== current.displayName) {
        await updateProfile(current, { displayName: name });
      }
      if (!db) throw new AuthMessage('Profile storage is not connected yet.');
      await setDoc(
        doc(db, 'users', current.uid),
        { ...next, ...(name ? { name } : null), updatedAt: serverTimestamp() },
        { merge: true },
      );
      setProfileEntry((prev) =>
        prev?.uid === current.uid
          ? { uid: current.uid, value: { ...prev.value, ...next, ...(name ? { name } : null) } }
          : prev,
      );
    },
    [],
  );

  const signOut = useCallback(async () => {
    await signOutOfGoogle();
    if (auth) await firebaseSignOut(auth);
  }, []);

  const deleteAccount = useCallback(async () => {
    const current = requireAuth().currentUser;
    if (!current) return;
    if (db) await deleteDoc(doc(db, 'users', current.uid)).catch(() => undefined);
    await deleteUser(current);
    await signOutOfGoogle();
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const email = user?.email?.toLowerCase() ?? '';
    return {
      configured: firebaseConfigured,
      initializing,
      user,
      verified,
      profile,
      displayName: profile.name || user?.displayName || user?.email?.split('@')[0] || 'Seeker',
      isPandit: email.length > 0 && !!user?.emailVerified && PANDIT_EMAILS.includes(email),
      usesPassword: !!user?.providerData.some((p) => p.providerId === 'password'),
      signIn,
      register,
      signInGoogle,
      resetPassword,
      resendVerification,
      checkVerification,
      saveProfile,
      signOut,
      deleteAccount,
    };
  }, [
    user,
    verified,
    initializing,
    profile,
    signIn,
    register,
    signInGoogle,
    resetPassword,
    resendVerification,
    checkVerification,
    saveProfile,
    signOut,
    deleteAccount,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
