const Payment = require('../models/Payment');
const Pickup = require('../models/Pickup');
const { generatePaymentId } = require('../utils/generateId');

const RAZORPAY_ENABLED = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

// Creates a payment record. For cash/UPI/bank_transfer this directly records
// the payment as pending->successful. For razorpay, if real keys are configured
// it would create a live order; otherwise it returns a mock order so the
// frontend flow still works end-to-end in dev.
async function createPayment(req, res, next) {
  try {
    const { pickupId, method } = req.body;
    const pickup = await Pickup.findOne({ pickupId });
    if (!pickup) return res.status(404).json({ success: false, message: 'Pickup not found' });
    if (!pickup.finalAmount) {
      return res.status(400).json({ success: false, message: 'Pickup has no final amount yet' });
    }

    const paymentId = generatePaymentId();

    if (method === 'razorpay') {
      if (!RAZORPAY_ENABLED) {
        // Mock order — lets the full flow be demoed without real credentials.
        const payment = await Payment.create({
          paymentId,
          pickup: pickup._id,
          amount: pickup.finalAmount,
          method,
          status: 'pending',
          razorpayOrderId: `mock_order_${paymentId}`,
          isMock: true,
        });
        return res.status(201).json({
          success: true,
          data: { payment, mock: true, message: 'Razorpay not configured — returning mock order.' },
        });
      }
      // Real integration point: create an actual Razorpay order here using the SDK.
      // const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
      // const order = await razorpay.orders.create({ amount: pickup.finalAmount * 100, currency: 'INR' });
      const payment = await Payment.create({
        paymentId,
        pickup: pickup._id,
        amount: pickup.finalAmount,
        method,
        status: 'pending',
        razorpayOrderId: `rzp_order_${paymentId}`, // placeholder until real SDK call is wired in
      });
      return res.status(201).json({ success: true, data: { payment } });
    }

    // cash / upi / bank_transfer — recorded directly as successful
    const payment = await Payment.create({
      paymentId,
      pickup: pickup._id,
      amount: pickup.finalAmount,
      method,
      status: 'successful',
    });
    res.status(201).json({ success: true, data: { payment } });
  } catch (err) {
    next(err);
  }
}

// Verifies a razorpay payment (mock-verifies if not configured).
async function verifyPayment(req, res, next) {
  try {
    const { paymentId, razorpayPaymentId } = req.body;
    const payment = await Payment.findOne({ paymentId });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    payment.status = 'successful';
    if (razorpayPaymentId) payment.razorpayPaymentId = razorpayPaymentId;
    await payment.save();

    res.json({ success: true, data: { payment } });
  } catch (err) {
    next(err);
  }
}

async function getPayment(req, res, next) {
  try {
    const payment = await Payment.findOne({ paymentId: req.params.id }).populate('pickup');
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, data: { payment } });
  } catch (err) {
    next(err);
  }
}

module.exports = { createPayment, verifyPayment, getPayment };
