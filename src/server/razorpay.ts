/** Server-only Razorpay helpers for the API routes. Never import this from app screens. */

/** ₹49 chat pass. Must match PASS_PRICE in src/state/chat-pass.ts. */
export const PASS_AMOUNT_PAISE = 4900;
export const PASS_PRODUCT = 'chat-pass-24h';

const RAZORPAY_API = 'https://api.razorpay.com/v1';

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: 'created' | 'attempted' | 'paid';
  notes: Record<string, string> | [];
};

function credentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new HttpError(500, 'Payments are not configured on the server.');
  return { keyId, keySecret };
}

export function publicKeyId() {
  return credentials().keyId;
}

async function razorpay<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { keyId, keySecret } = credentials();
  const response = await fetch(`${RAZORPAY_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
      'Content-Type': 'application/json',
    },
  });
  const body = (await response.json().catch(() => null)) as { error?: { description?: string } } | null;
  if (response.status === 401) throw new HttpError(401, 'The payment gateway rejected the API keys.');
  if (!response.ok) {
    console.error('Razorpay error', response.status, body);
    throw new HttpError(500, body?.error?.description ?? 'The payment gateway is unavailable. Try again.');
  }
  return body as T;
}

export function createOrder(input: { amount: number; receipt: string; notes: Record<string, string> }) {
  if (!Number.isInteger(input.amount) || input.amount < 100) {
    throw new HttpError(400, 'Amount must be at least 100 paise.');
  }
  return razorpay<RazorpayOrder>('/orders', {
    method: 'POST',
    body: JSON.stringify({ amount: input.amount, currency: 'INR', receipt: input.receipt, notes: input.notes }),
  });
}

export function fetchOrder(orderId: string) {
  if (!/^order_[A-Za-z0-9]+$/.test(orderId)) throw new HttpError(400, 'Invalid order id.');
  return razorpay<RazorpayOrder>(`/orders/${orderId}`);
}

/** The captured payment for an order, read straight from Razorpay. */
export async function capturedPayment(orderId: string) {
  const list = await razorpay<{ items: { id: string; status: string; amount: number }[] }>(
    `/orders/${orderId}/payments`,
  );
  return list.items.find((p) => p.status === 'captured') ?? null;
}

export function orderNote(order: RazorpayOrder, key: string) {
  return Array.isArray(order.notes) ? undefined : order.notes[key];
}

async function hmacSha256Hex(secret: string, message: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, '0')).join('');
}

function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Razorpay Standard Checkout: HMAC-SHA256(order_id + "|" + payment_id, key_secret). */
export async function isValidPaymentSignature(orderId: string, paymentId: string, signature: string) {
  const expected = await hmacSha256Hex(credentials().keySecret, `${orderId}|${paymentId}`);
  return constantTimeEqual(expected, signature.toLowerCase());
}

export function errorResponse(error: unknown) {
  if (error instanceof HttpError) return Response.json({ success: false, error: error.message }, { status: error.status });
  console.error(error);
  return Response.json({ success: false, error: 'Something went wrong. Please try again.' }, { status: 500 });
}
