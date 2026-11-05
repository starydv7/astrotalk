import { grantPass } from '@/server/firebase-rest';
import {
  capturedPayment,
  errorResponse,
  fetchOrder,
  orderNote,
  PASS_AMOUNT_PAISE,
  PASS_PRODUCT,
  publicKeyId,
} from '@/server/razorpay';

/** Only deep links back into the app (or Expo dev clients) are allowed as return addresses. */
const RETURN_URL = /^(astrotalk|exp|exps):\/\/[\w\-./:@%?=&]*$/;
const DEFAULT_RETURN = 'astrotalk://payment-complete';

/** Hosted Razorpay Standard Checkout page, opened in an in-app browser tab. */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const order = await fetchOrder(url.searchParams.get('order_id') ?? '');
    if (orderNote(order, 'product') !== PASS_PRODUCT) {
      return Response.json({ success: false, error: 'This order is not a chat pass.' }, { status: 400 });
    }
    // Paid earlier but the confirmation never arrived (tab closed): activate the pass from Razorpay's record.
    let paid = false;
    const uid = orderNote(order, 'uid');
    if (order.status === 'paid' && uid && order.amount === PASS_AMOUNT_PAISE) {
      const payment = await capturedPayment(order.id);
      if (payment) {
        await grantPass({ uid, paymentId: payment.id, orderId: order.id, amountPaise: order.amount });
        paid = true;
      }
    }

    const requested = url.searchParams.get('return') ?? '';
    const config = {
      key: publicKeyId(),
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      paid,
      name: orderNote(order, 'name') ?? '',
      email: orderNote(order, 'email') ?? '',
      returnUrl: RETURN_URL.test(requested) ? requested : DEFAULT_RETURN,
    };
    return new Response(page(config), {
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

function page(config: Record<string, unknown>) {
  const json = JSON.stringify(config).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="robots" content="noindex" />
<title>AstroTalk · Secure payment</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: radial-gradient(circle at 70% 10%, #2a1b55 0%, #0e0a20 55%, #07060f 100%);
    color: #f3efff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; }
  main { width: 100%; max-width: 380px; text-align: center; padding: 28px 22px; border-radius: 26px;
    border: 1px solid rgba(232,196,122,.4); background: rgba(20,14,44,.75); }
  .mark { width: 56px; height: 56px; margin: 0 auto; border-radius: 50%; display: flex; align-items: center;
    justify-content: center; border: 1px solid rgba(232,196,122,.45); background: rgba(232,196,122,.08); }
  .eyebrow { color: #e8c47a; font-size: 11px; font-weight: 700; letter-spacing: 2.4px; margin-top: 6px; }
  h1 { margin: 10px 0 4px; font-size: 22px; }
  .price { font-size: 44px; font-weight: 800; color: #f6e7c1; margin: 8px 0; }
  .sub { color: #bdb7d6; font-size: 14px; line-height: 20px; margin: 0 0 18px; }
  #status { min-height: 20px; font-size: 14px; color: #d7d3ec; margin: 14px 0; }
  #status.error { color: #ff9b9b; }
  #status.ok { color: #5ee2a0; }
  button, a.btn { display: block; width: 100%; height: 52px; border-radius: 16px; border: 0; font-size: 16px;
    font-weight: 700; cursor: pointer; text-decoration: none; line-height: 52px; margin-top: 10px; }
  .gold { background: linear-gradient(135deg, #f6e7c1, #e8c47a 50%, #c6a15a); color: #1a1206; }
  .ghost { background: transparent; color: #e8c47a; border: 1px solid rgba(232,196,122,.35); }
  .hidden { display: none; }
  .secure { margin-top: 16px; font-size: 12px; color: #8a84a3; }
</style>
</head>
<body>
<main>
  <div class="mark" aria-hidden="true">
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#e8c47a" stroke-width="1.8"
      stroke-linecap="round" stroke-linejoin="round">
      <rect x="4" y="10.5" width="16" height="10" rx="2.5" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
      <circle cx="12" cy="15.5" r="1.4" fill="#e8c47a" stroke="none" />
    </svg>
  </div>
  <div class="eyebrow">ASTROTALK</div>
  <h1>24-hour chat pass</h1>
  <div class="price">₹<span id="amount"></span></div>
  <p class="sub">Unlimited text and photo chat with every expert for 24 hours.</p>
  <div id="status">Opening secure payment…</div>
  <button id="pay" class="gold hidden" type="button">Pay now</button>
  <button id="retry" class="gold hidden" type="button">Retry confirmation</button>
  <a id="back" class="btn ghost" href="#">Back to AstroTalk</a>
  <div class="secure">Payments are processed securely by Razorpay.</div>
</main>
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
<script>
  var cfg = ${json};
  var statusEl = document.getElementById('status');
  var payBtn = document.getElementById('pay');
  var retryBtn = document.getElementById('retry');
  var backLink = document.getElementById('back');
  var lastResponse = null;
  document.getElementById('amount').textContent = String(cfg.amount / 100);

  function returnTo(status, message) {
    var sep = cfg.returnUrl.indexOf('?') === -1 ? '?' : '&';
    var href = cfg.returnUrl + sep + 'status=' + status + (message ? '&message=' + encodeURIComponent(message) : '');
    window.location.href = href;
  }
  function setStatus(text, kind) {
    statusEl.textContent = text;
    statusEl.className = kind || '';
  }
  backLink.addEventListener('click', function (e) { e.preventDefault(); returnTo('cancelled'); });

  function verify(response) {
    lastResponse = response;
    retryBtn.classList.add('hidden');
    payBtn.classList.add('hidden');
    setStatus('Confirming your payment…');
    fetch('/api/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_signature: response.razorpay_signature
      })
    })
      .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
      .then(function (r) {
        if (r.ok && r.data.success) {
          setStatus('Payment successful. Your pass is active.', 'ok');
          setTimeout(function () { returnTo('success'); }, 900);
        } else {
          setStatus(r.data.error || 'We could not confirm the payment.', 'error');
          retryBtn.classList.remove('hidden');
        }
      })
      .catch(function () {
        setStatus('No connection. Your payment is safe; tap retry.', 'error');
        retryBtn.classList.remove('hidden');
      });
  }
  retryBtn.addEventListener('click', function () { if (lastResponse) verify(lastResponse); });

  function openCheckout() {
    if (typeof Razorpay === 'undefined') {
      setStatus('Could not load the payment page. Check your internet.', 'error');
      payBtn.classList.remove('hidden');
      return;
    }
    payBtn.classList.add('hidden');
    setStatus('Complete the payment in the secure window.');
    var rzp = new Razorpay({
      key: cfg.key,
      amount: cfg.amount,
      currency: cfg.currency,
      order_id: cfg.orderId,
      name: 'AstroTalk',
      description: '24-hour chat pass',
      prefill: { name: cfg.name, email: cfg.email },
      theme: { color: '#C6A15A' },
      handler: verify,
      modal: {
        ondismiss: function () {
          if (lastResponse) return;
          setStatus('Payment cancelled. You have not been charged.');
          payBtn.classList.remove('hidden');
        }
      }
    });
    rzp.on('payment.failed', function (r) {
      var reason = (r && r.error && (r.error.description || r.error.reason)) || 'Payment failed.';
      setStatus(reason + ' You can try again.', 'error');
    });
    rzp.open();
  }
  payBtn.addEventListener('click', openCheckout);

  if (cfg.paid) {
    setStatus('This order is already paid.', 'ok');
    setTimeout(function () { returnTo('success'); }, 900);
  } else {
    window.addEventListener('load', openCheckout);
  }
</script>
</body>
</html>`;
}
