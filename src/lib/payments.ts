import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { auth } from '@/lib/firebase';

/** Where the API routes in src/app/api are deployed, e.g. https://astrotalk.expo.app */
const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '') ?? '';

export const paymentsConfigured = API_URL.length > 0;

export type CheckoutResult =
  | { status: 'success' }
  | { status: 'cancelled' }
  | { status: 'failed'; message: string };

/**
 * Buys a 24-hour chat pass with Razorpay Standard Checkout:
 * the server creates the order, the hosted checkout page takes the payment and verifies it,
 * then deep-links back. The pass itself arrives through the Firestore `passes` listener.
 */
export async function buyChatPass(): Promise<CheckoutResult> {
  if (!paymentsConfigured) return { status: 'failed', message: 'Payments are not set up in this build yet.' };
  const user = auth?.currentUser;
  if (!user) return { status: 'failed', message: 'Please sign in again to buy a pass.' };

  let orderId: string;
  try {
    const response = await fetch(`${API_URL}/api/create-order`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${await user.getIdToken()}`, 'Content-Type': 'application/json' },
      body: '{}',
    });
    const body = (await response.json().catch(() => null)) as { order_id?: string; error?: string } | null;
    if (!response.ok || !body?.order_id) {
      return { status: 'failed', message: body?.error ?? 'Could not start the payment. Try again.' };
    }
    orderId = body.order_id;
  } catch {
    return { status: 'failed', message: 'No connection. Check your internet and try again.' };
  }

  const returnUrl = Linking.createURL('payment-complete');
  const checkoutUrl = `${API_URL}/api/checkout?order_id=${encodeURIComponent(orderId)}&return=${encodeURIComponent(returnUrl)}`;
  const result = await WebBrowser.openAuthSessionAsync(checkoutUrl, returnUrl);
  if (result.type !== 'success') return { status: 'cancelled' };

  const { queryParams } = Linking.parse(result.url);
  const status = queryParams?.status;
  if (status === 'success') return { status: 'success' };
  if (status === 'failed') {
    return { status: 'failed', message: String(queryParams?.message ?? 'The payment did not go through.') };
  }
  return { status: 'cancelled' };
}
