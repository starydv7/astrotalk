import { verifyIdToken } from '@/server/firebase-rest';
import { createOrder, errorResponse, PASS_AMOUNT_PAISE, PASS_PRODUCT, publicKeyId } from '@/server/razorpay';

/** Creates a Razorpay order for a ₹49 chat pass. The price is fixed here, never taken from the client. */
export async function POST(request: Request) {
  try {
    const idToken = request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
    if (!idToken) {
      return Response.json({ success: false, error: 'Please sign in to buy a chat pass.' }, { status: 401 });
    }
    const user = await verifyIdToken(idToken);
    const order = await createOrder({
      amount: PASS_AMOUNT_PAISE,
      receipt: `pass_${Date.now()}`,
      notes: {
        uid: user.uid,
        product: PASS_PRODUCT,
        name: user.name.slice(0, 120),
        email: user.email.slice(0, 120),
      },
    });
    return Response.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: publicKeyId(),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
