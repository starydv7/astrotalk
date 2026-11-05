import { doc, onSnapshot, Timestamp } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type { LiveChat } from '@/state/live-chats';

/** Must match PASS_AMOUNT_PAISE in src/server/razorpay.ts and the rules in `firestore.rules`. */
export const PASS_PRICE = 49;
export const FREE_MS = 2 * 60 * 1000;

/** Customer's gate inside a live chat. */
export type ChatAccess =
  | { kind: 'pass'; until: number }
  | { kind: 'free'; until: number }
  | { kind: 'locked' };

export function chatAccess(chat: LiveChat | null, passUntil: number, now = Date.now()): ChatAccess {
  if (passUntil > now) return { kind: 'pass', until: passUntil };
  const freeUntil = chat?.acceptedAt ? chat.acceptedAt + FREE_MS : now + FREE_MS;
  if (chat?.status === 'live' && freeUntil <= now) return { kind: 'locked' };
  return { kind: 'free', until: freeUntil };
}

export function formatRemaining(ms: number) {
  const minutes = Math.max(0, Math.ceil(ms / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

/** Milliseconds timestamp the customer's pass is valid until, or 0. */
export function watchPass(uid: string, onChange: (validUntil: number) => void) {
  if (!db) {
    onChange(0);
    return () => undefined;
  }
  return onSnapshot(
    doc(db, 'passes', uid),
    (snap) => {
      const value = snap.data()?.validUntil;
      onChange(value instanceof Timestamp ? value.toMillis() : 0);
    },
    () => onChange(0),
  );
}
