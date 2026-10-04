const express = require('express');
const { createPayment, verifyPayment, getPayment, myPayments } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const { validate, z } = require('../middleware/validate');

const router = express.Router();

// The webhook route is mounted separately in app.js (it needs the raw body).
router.use(protect);
router.get('/', myPayments);
router.post('/create', validate(z.object({ quoteId: z.string().max(40) })), createPayment);
router.post(
  '/verify',
  validate(
    z.object({
      paymentId: z.string().max(60),
      razorpayOrderId: z.string().max(80),
      razorpayPaymentId: z.string().max(80).optional(),
      razorpaySignature: z.string().max(200).optional(),
    })
  ),
  verifyPayment
);
router.get('/:id', getPayment);

module.exports = router;
