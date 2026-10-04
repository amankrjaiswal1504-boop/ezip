const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    paymentId: { type: String, required: true, unique: true },
    pickup: { type: mongoose.Schema.Types.ObjectId, ref: 'Pickup', required: true, index: true },
    amount: { type: Number, required: true },
    method: {
      type: String,
      enum: ['cash', 'upi', 'bank_transfer', 'razorpay'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'successful', 'failed'],
      default: 'pending',
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    isMock: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
