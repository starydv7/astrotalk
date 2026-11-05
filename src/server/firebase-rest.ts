/** Server-only Firebase access over REST, so it runs in the Expo Hosting worker runtime. */
import { HttpError } from '@/server/razorpay';

const PASS_MS = 24 * 60 * 60 * 1000;

function firebaseEnv() {
  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  if (!apiKey || !projectId) throw new HttpError(500, 'Firebase is not configured on the server.');
  return { apiKey, projectId };
}

export type VerifiedUser = { uid: string; name: string; email: string };

/** Validates a Firebase ID token sent by the app and returns who it belongs to. */
export async function verifyIdToken(idToken: string): Promise<VerifiedUser> {
  const { apiKey } = firebaseEnv();
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  const body = (await response.json().catch(() => null)) as {
    users?: { localId: string; displayName?: string; email?: string }[];
  } | null;
  const user = body?.users?.[0];
  if (!response.ok || !user) throw new HttpError(401, 'Your session has expired. Please sign in again.');
  return { uid: user.localId, name: user.displayName ?? '', email: user.email ?? '' };
}

let cachedToken: { value: string; expiresAt: number } | null = null;

/** ID token of the payments server account; firestore.rules lets only this uid grant passes. */
async function serverToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const { apiKey } = firebaseEnv();
  const email = process.env.PAYMENTS_BOT_EMAIL;
  const password = process.env.PAYMENTS_BOT_PASSWORD;
  if (!email || !password) throw new HttpError(500, 'The payment server account is not configured.');

  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const body = (await response.json().catch(() => null)) as { idToken?: string; expiresIn?: string } | null;
  if (!response.ok || !body?.idToken) {
    console.error('Payments server sign-in failed', response.status, body);
    throw new HttpError(500, 'The payment server could not sign in.');
  }
  cachedToken = { value: body.idToken, expiresAt: Date.now() + Number(body.expiresIn ?? 3600) * 1000 };
  return body.idToken;
}

function documentName(path: string) {
  return `projects/${firebaseEnv().projectId}/databases/(default)/documents/${path}`;
}

async function firestore(path: string, init: RequestInit = {}) {
  const token = await serverToken();
  return fetch(`https://firestore.googleapis.com/v1/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
}

async function readDocument(path: string) {
  const response = await firestore(documentName(path));
  if (response.status === 404) return null;
  if (!response.ok) {
    console.error('Firestore read failed', path, response.status, await response.text());
    throw new HttpError(500, 'Payment received, but the pass service is unavailable. Tap retry.');
  }
  return (await response.json()) as { fields?: Record<string, { timestampValue?: string }> };
}

/**
 * Records the payment and starts (or extends) the customer's 24-hour pass in one atomic write.
 * Safe to call twice for the same payment: the second call changes nothing.
 */
export async function grantPass(input: { uid: string; paymentId: string; orderId: string; amountPaise: number }) {
  const existingPayment = await readDocument(`payments/${input.paymentId}`);
  const pass = await readDocument(`passes/${input.uid}`);
  const currentUntil = Date.parse(pass?.fields?.validUntil?.timestampValue ?? '') || 0;
  if (existingPayment) return { validUntil: currentUntil, alreadyGranted: true };

  const validUntil = Math.max(Date.now(), currentUntil) + PASS_MS;
  const { projectId } = firebaseEnv();
  const response = await firestore(`projects/${projectId}/databases/(default)/documents:commit`, {
    method: 'POST',
    body: JSON.stringify({
      writes: [
        {
          update: {
            name: documentName(`payments/${input.paymentId}`),
            fields: {
              customerUid: { stringValue: input.uid },
              amount: { integerValue: String(input.amountPaise / 100) },
              orderId: { stringValue: input.orderId },
              paymentId: { stringValue: input.paymentId },
              provider: { stringValue: 'razorpay' },
            },
          },
          updateTransforms: [{ fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' }],
          currentDocument: { exists: false },
        },
        {
          update: {
            name: documentName(`passes/${input.uid}`),
            fields: { validUntil: { timestampValue: new Date(validUntil).toISOString() } },
          },
          updateTransforms: [{ fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' }],
        },
      ],
    }),
  });
  if (!response.ok) {
    console.error('Granting pass failed', response.status, await response.text());
    throw new HttpError(500, 'Payment received, but the pass could not be activated yet. Tap retry.');
  }
  return { validUntil, alreadyGranted: false };
}
