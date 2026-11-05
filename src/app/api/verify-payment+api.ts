import { grantPass } from '@/server/firebase-rest';
import {
  errorResponse,
  fetchOrder,
  isValidPaymentSignature,
  orderNote,
  PASS_AMOUNT_PAISE,
  PASS_PRODUCT,
} from '@/server/razorpay';

function field(body: unknown, key: string) {
  const value = (body as Record<string, unknown> | null)?.[key];
  return typeof value === 'string' && value.length > 0 && value.length < 200 ? value : null;
}

/** Verifies the Razorpay signature, then activates the customer's 24-hour pass. */
export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => null);
    const orderId = field(body, 'razorpay_order_id');
    const paymentId = field(body, 'razorpay_payment_id');
    const signature = field(body, 'razorpay_signature');
    if (!orderId || !paymentId || !signature) {
      return Response.json({ success: false, error: 'Missing payment details.' }, { status: 400 });
    }

    if (!(await isValidPaymentSignature(orderId, paymentId, signature))) {
      return Response.json({ success: false, error: 'Payment could not be verified.' }, { status: 400 });
    }

    const order = await fetchOrder(orderId);
    const uid = orderNote(order, 'uid');
    if (!uid || orderNote(order, 'product') !== PASS_PRODUCT || order.amount !== PASS_AMOUNT_PAISE) {
      return Response.json({ success: false, error: 'This order is not a chat pass.' }, { status: 400 });
    }

    const pass = await grantPass({ uid, paymentId, orderId, amountPaise: order.amount });
    return Response.json({
      success: true,
      valid_until: new Date(pass.validUntil).toISOString(),
      already_granted: pass.alreadyGranted,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
