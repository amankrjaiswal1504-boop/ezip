const Payment = require('../models/Payment');
const { Quote } = require('../models/platform');
const gateway = require('../services/paymentGateway');
const { generatePaymentId } = require('../utils/generateId');
const logger = require('../utils/logger');

// Razorpay checkout is used when a business pays ScrapMate (e.g. a certified
// e-waste disposal fee on an accepted quote). Customer payouts for scrap go
// through bookingService.payOut instead.
async function createPayment(req, res, next) {
  try {
    const { quoteId } = req.body;
    const quote = await Quote.findOne({ quoteId, customer: req.user._id });
    if (!quote || quote.quotedAmount == null || quote.quotedAmount <= 0) {
      return res.status(404).json({ success: false, message: 'No payable quote found' });
    }
    const amount = quote.quotedAmount;
    const order = await gateway.createOrder({ amount, receipt: quote.quoteId, notes: { quoteId: quote.quoteId } });
    const payment = await Payment.create({
      paymentId: generatePaymentId(),
      user: req.user._id,
      amount,
      direction: 'collection',
      purpose: 'quote',
      method: 'razorpay',
      status: 'pending',
      razorpayOrderId: order.id,
      isMock: order.mock,
    });
    res.status(201).json({
      success: true,
      data: { payment, order: { id: order.id, amount: order.amount, currency: 'INR' }, keyId: process.env.RAZORPAY_KEY_ID || null, mock: order.mock },
    });
  } catch (err) {
    next(err);
  }
}

// Called by the browser after Razorpay checkout succeeds.
async function verifyPayment(req, res, next) {
  try {
    const { paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const payment = await Payment.findOne({ paymentId, user: req.user._id });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    if (payment.status === 'successful') return res.json({ success: true, data: { payment } });
    const ok =
      razorpayOrderId === payment.razorpayOrderId &&
      gateway.verifyCheckoutSignature({ orderId: razorpayOrderId, paymentId: razorpayPaymentId || 'mock', signature: razorpaySignature });
    if (!ok) {
      payment.status = 'failed';
      payment.failureReason = 'Signature verification failed';
      await payment.save();
      return res.status(400).json({ success: false, message: 'Payment could not be verified' });
    }
    payment.status = 'successful';
    payment.razorpayPaymentId = razorpayPaymentId || `mock_pay_${Date.now()}`;
    await payment.save();
    res.json({ success: true, data: { payment } });
  } catch (err) {
    next(err);
  }
}

// Razorpay webhook (payment.captured / payment.failed / payout.*). Needs the
// raw body; mounted with express.raw in app.js.
async function webhook(req, res) {
  const signature = req.get('x-razorpay-signature');
  const raw = req.body instanceof Buffer ? req.body : Buffer.from(JSON.stringify(req.body || {}));
  if (!gateway.verifyWebhookSignature(raw, signature)) {
    return res.status(400).json({ success: false, message: 'Invalid signature' });
  }
  try {
    const event = JSON.parse(raw.toString('utf8'));
    const entity = event.payload?.payment?.entity;
    if (entity?.order_id) {
      const payment = await Payment.findOne({ razorpayOrderId: entity.order_id });
      if (payment && payment.status !== 'successful') {
        if (event.event === 'payment.captured') {
          payment.status = 'successful';
          payment.razorpayPaymentId = entity.id;
        } else if (event.event === 'payment.failed') {
          payment.status = 'failed';
          payment.failureReason = entity.error_description;
        }
        await payment.save();
      }
    }
    const payout = event.payload?.payout?.entity;
    if (payout?.id) {
      const Pickup = require('../models/Pickup');
      const status = { processed: 'paid', reversed: 'failed', failed: 'failed', rejected: 'failed' }[payout.status];
      if (status) {
        await Pickup.updateOne({ 'payout.reference': payout.id }, { 'payout.status': status, ...(status === 'paid' ? { 'payout.paidAt': new Date() } : {}) });
        await Payment.updateOne({ payoutReference: payout.id }, { status: status === 'paid' ? 'successful' : 'failed' });
      }
    }
    res.json({ success: true });
  } catch (err) {
    logger.error({ err: err.message }, 'webhook processing failed');
    res.status(200).json({ success: false }); // acknowledge; Razorpay retries otherwise
  }
}

async function getPayment(req, res, next) {
  try {
    const filter = { paymentId: req.params.id };
    if (!['admin', 'staff'].includes(req.user.role)) filter.user = req.user._id;
    const payment = await Payment.findOne(filter).populate('pickup', 'pickupId status');
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, data: { payment } });
  } catch (err) {
    next(err);
  }
}

async function myPayments(req, res, next) {
  try {
    const payments = await Payment.find({ user: req.user._id }).populate('pickup', 'pickupId').sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: { payments } });
  } catch (err) {
    next(err);
  }
}

module.exports = { createPayment, verifyPayment, webhook, getPayment, myPayments };
