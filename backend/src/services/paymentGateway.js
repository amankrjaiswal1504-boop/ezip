// Razorpay (orders, signature + webhook verification) and RazorpayX payouts.
// Without keys every call returns a clearly marked mock so flows still work.
const crypto = require('crypto');
const logger = require('../utils/logger');

function razorpayEnabled() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}
function payoutsEnabled() {
  return razorpayEnabled() && Boolean(process.env.RAZORPAYX_ACCOUNT_NUMBER);
}

let client = null;
function razorpay() {
  if (!client) {
    const Razorpay = require('razorpay');
    client = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
  }
  return client;
}

async function createOrder({ amount, receipt, notes }) {
  const paise = Math.round(Number(amount) * 100);
  if (!razorpayEnabled()) {
    return { id: `mock_order_${crypto.randomBytes(6).toString('hex')}`, amount: paise, currency: 'INR', mock: true };
  }
  const order = await razorpay().orders.create({ amount: paise, currency: 'INR', receipt, notes });
  return { ...order, mock: false };
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// Checkout signature: HMAC_SHA256(order_id|payment_id, key_secret)
function verifyCheckoutSignature({ orderId, paymentId, signature }) {
  if (!razorpayEnabled()) return String(orderId).startsWith('mock_order_');
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return safeEqual(expected, signature);
}

// Webhook signature: HMAC_SHA256(raw body, webhook secret)
function verifyWebhookSignature(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return safeEqual(expected, signature);
}

// Instant UPI / bank payout to a customer (RazorpayX). Mock when not configured.
async function sendPayout({ amount, method, upiId, bankAccount, name, reference }) {
  if (!payoutsEnabled()) {
    logger.info({ amount, method, reference }, '[mock-payout] payout recorded without RazorpayX');
    return { id: `mock_payout_${crypto.randomBytes(6).toString('hex')}`, status: 'processed', mock: true };
  }
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
  const fundAccount =
    method === 'upi'
      ? { account_type: 'vpa', vpa: { address: upiId } }
      : {
          account_type: 'bank_account',
          bank_account: { name: bankAccount?.holderName || name, ifsc: bankAccount?.ifsc, account_number: bankAccount?.accountNumber },
        };
  const res = await fetch('https://api.razorpay.com/v1/payouts', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json', 'X-Payout-Idempotency': reference },
    body: JSON.stringify({
      account_number: process.env.RAZORPAYX_ACCOUNT_NUMBER,
      amount: Math.round(amount * 100),
      currency: 'INR',
      mode: method === 'upi' ? 'UPI' : 'IMPS',
      purpose: 'payout',
      fund_account: { ...fundAccount, contact: { name, type: 'customer', reference_id: reference } },
      queue_if_low_balance: true,
      reference_id: reference,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data?.error?.description || 'Payout failed'), { status: 502 });
  return { id: data.id, status: data.status, mock: false };
}

module.exports = { createOrder, verifyCheckoutSignature, verifyWebhookSignature, sendPayout, razorpayEnabled, payoutsEnabled };
