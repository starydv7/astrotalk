import type { Persistence, ReactNativeAsyncStorage } from 'firebase/auth';

// The React Native build of firebase/auth exports this, but the package's
// top-level type entry resolves to the browser declarations.
declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: ReactNativeAsyncStorage): Persistence;
}
