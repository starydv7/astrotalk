import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type DocumentSnapshot,
  type Firestore,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';

/** A chat and every message in it are deleted this long after the request. */
export const CHAT_TTL_MS = 24 * 60 * 60 * 1000;
export const WAIT_OPTIONS = [2, 5, 10] as const;
export type WaitMinutes = (typeof WAIT_OPTIONS)[number];

export type ChatStatus = 'waiting' | 'live' | 'ended';
/** `missed` is a waiting request whose accept window has run out. */
export type ChatPhase = ChatStatus | 'missed';

export type LiveChat = {
  id: string;
  customerUid: string;
  customerName: string;
  customerPhoto: string | null;
  panditId: string;
  status: ChatStatus;
  requestedAt: number;
  acceptBy: number;
  acceptedAt: number | null;
  expiresAt: number;
  lastText: string;
  lastAt: number;
};

export type LiveMessage = {
  id: string;
  from: 'customer' | 'pandit';
  kind: 'text' | 'photo';
  text?: string;
  image?: string;
  createdAt: number;
};

export type Desk = { online: boolean; waitMinutes: WaitMinutes };

const DEFAULT_DESK: Desk = { online: true, waitMinutes: 2 };

function requireDb(): Firestore {
  if (!db) throw new Error('Chat is not connected yet.');
  return db;
}

function millis(value: unknown, fallback = Date.now()) {
  return value instanceof Timestamp ? value.toMillis() : fallback;
}

function toChat(snap: DocumentSnapshot<DocumentData>): LiveChat | null {
  const data = snap.data({ serverTimestamps: 'estimate' });
  if (!data) return null;
  return {
    id: snap.id,
    customerUid: String(data.customerUid ?? ''),
    customerName: String(data.customerName ?? 'Customer'),
    customerPhoto: typeof data.customerPhoto === 'string' ? data.customerPhoto : null,
    panditId: String(data.panditId ?? ''),
    status: data.status === 'live' || data.status === 'ended' ? data.status : 'waiting',
    requestedAt: millis(data.requestedAt),
    acceptBy: millis(data.acceptBy),
    acceptedAt: data.acceptedAt instanceof Timestamp ? data.acceptedAt.toMillis() : null,
    expiresAt: millis(data.expiresAt),
    lastText: String(data.lastText ?? ''),
    lastAt: millis(data.lastAt),
  };
}

export function chatPhase(chat: LiveChat, now = Date.now()): ChatPhase {
  if (chat.status === 'waiting' && now >= chat.acceptBy) return 'missed';
  return chat.status;
}

export function isExpired(chat: LiveChat, now = Date.now()) {
  return chat.expiresAt <= now;
}

export function remainingWaitMs(chat: LiveChat, now = Date.now()) {
  return Math.max(0, chat.acceptBy - now);
}

export function formatClock(ms: number) {
  const total = Math.ceil(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/* ---------- Desk (pandit availability and accept window) ---------- */

export function watchDesk(onChange: (desk: Desk) => void) {
  if (!db) {
    onChange(DEFAULT_DESK);
    return () => undefined;
  }
  return onSnapshot(
    doc(db, 'settings', 'desk'),
    (snap) => {
      const data = snap.data();
      const wait = WAIT_OPTIONS.find((w) => w === data?.waitMinutes) ?? DEFAULT_DESK.waitMinutes;
      onChange({ online: data?.online !== false, waitMinutes: wait });
    },
    () => onChange(DEFAULT_DESK),
  );
}

export async function saveDesk(desk: Desk) {
  await setDoc(doc(requireDb(), 'settings', 'desk'), { online: desk.online, waitMinutes: desk.waitMinutes });
}

/* ---------- Chats ---------- */

function sortChats(chats: LiveChat[]) {
  return chats.sort((a, b) => b.requestedAt - a.requestedAt);
}

/** Every chat the signed-in customer has open. Expired chats are removed from the database. */
export function watchCustomerChats(uid: string, onChange: (chats: LiveChat[]) => void) {
  if (!db) {
    onChange([]);
    return () => undefined;
  }
  return onSnapshot(
    query(collection(db, 'chats'), where('customerUid', '==', uid)),
    (snap) => {
      const all = snap.docs.map(toChat).filter((c): c is LiveChat => c !== null);
      const now = Date.now();
      all.filter((c) => isExpired(c, now)).forEach((c) => void purgeChat(c.id).catch(() => undefined));
      onChange(sortChats(all.filter((c) => !isExpired(c, now))));
    },
    () => onChange([]),
  );
}

/** Every chat for the pandit. */
export function watchPanditChats(onChange: (chats: LiveChat[]) => void) {
  if (!db) {
    onChange([]);
    return () => undefined;
  }
  void purgeExpiredChats().catch(() => undefined);
  return onSnapshot(
    query(collection(db, 'chats'), where('expiresAt', '>', Timestamp.now())),
    (snap) => {
      const now = Date.now();
      const all = snap.docs.map(toChat).filter((c): c is LiveChat => c !== null);
      onChange(sortChats(all.filter((c) => !isExpired(c, now))));
    },
    () => onChange([]),
  );
}

export function watchChat(chatId: string, onChange: (chat: LiveChat | null) => void) {
  if (!db) {
    onChange(null);
    return () => undefined;
  }
  return onSnapshot(
    doc(db, 'chats', chatId),
    (snap) => {
      const chat = snap.exists() ? toChat(snap) : null;
      onChange(chat && !isExpired(chat) ? chat : null);
    },
    () => onChange(null),
  );
}

export function watchMessages(chatId: string, onChange: (messages: LiveMessage[]) => void) {
  if (!db) {
    onChange([]);
    return () => undefined;
  }
  return onSnapshot(
    query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc')),
    (snap) => {
      onChange(
        snap.docs.map((d) => {
          const data = d.data({ serverTimestamps: 'estimate' });
          return {
            id: d.id,
            from: data.from === 'pandit' ? 'pandit' : 'customer',
            kind: data.kind === 'photo' ? 'photo' : 'text',
            text: typeof data.text === 'string' ? data.text : undefined,
            image: typeof data.image === 'string' ? data.image : undefined,
            createdAt: millis(data.createdAt),
          };
        }),
      );
    },
    () => onChange([]),
  );
}

export async function requestChat(input: {
  panditId: string;
  customerUid: string;
  customerName: string;
  customerPhoto: string | null;
  waitMinutes: WaitMinutes;
}) {
  const now = Date.now();
  const ref = await addDoc(collection(requireDb(), 'chats'), {
    customerUid: input.customerUid,
    customerName: input.customerName,
    customerPhoto: input.customerPhoto,
    panditId: input.panditId,
    status: 'waiting',
    requestedAt: serverTimestamp(),
    acceptBy: Timestamp.fromMillis(now + input.waitMinutes * 60 * 1000),
    acceptedAt: null,
    expiresAt: Timestamp.fromMillis(now + CHAT_TTL_MS),
    lastText: 'Chat requested',
    lastAt: serverTimestamp(),
  });
  return ref.id;
}

export async function acceptChat(chatId: string) {
  await updateDoc(doc(requireDb(), 'chats', chatId), {
    status: 'live',
    acceptedAt: serverTimestamp(),
    lastText: 'Pandit joined the chat',
    lastAt: serverTimestamp(),
  });
}

export async function endChat(chatId: string) {
  await updateDoc(doc(requireDb(), 'chats', chatId), {
    status: 'ended',
    lastText: 'Chat ended',
    lastAt: serverTimestamp(),
  });
}

export async function sendLiveMessage(
  chat: LiveChat,
  message: { from: LiveMessage['from']; kind: 'text'; text: string } | { from: LiveMessage['from']; kind: 'photo'; image: string },
) {
  const store = requireDb();
  const base = {
    from: message.from,
    kind: message.kind,
    createdAt: serverTimestamp(),
    expiresAt: Timestamp.fromMillis(chat.expiresAt),
  };
  const text = message.kind === 'text' ? message.text.trim() : '';
  if (message.kind === 'text' && !text) return;

  await addDoc(
    collection(store, 'chats', chat.id, 'messages'),
    message.kind === 'text' ? { ...base, text } : { ...base, image: message.image },
  );
  await updateDoc(doc(store, 'chats', chat.id), {
    lastText: message.kind === 'text' ? text.slice(0, 120) : 'Photo',
    lastAt: serverTimestamp(),
  }).catch(() => undefined);
}

/** Deletes a chat and all of its messages. */
export async function purgeChat(chatId: string) {
  const store = requireDb();
  const messages = await getDocs(collection(store, 'chats', chatId, 'messages'));
  for (let i = 0; i < messages.docs.length; i += 400) {
    const batch = writeBatch(store);
    messages.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  await deleteDoc(doc(store, 'chats', chatId));
}

async function purgeExpiredChats() {
  const store = requireDb();
  const expired = await getDocs(query(collection(store, 'chats'), where('expiresAt', '<=', Timestamp.now())));
  for (const d of expired.docs) {
    await purgeChat(d.id);
  }
}
