const mongoose = require('mongoose');

const PICKUP_STATUSES = [
  'BOOKED',
  'ASSIGNED',
  'COLLECTOR_ON_THE_WAY',
  'ARRIVED',
  'WEIGHING',
  'COMPLETED',
  'CANCELLED',
];

const pickupItemSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'ScrapItem', required: true },
    itemName: { type: String, required: true }, // snapshot at booking time
    estimatedQuantity: { type: Number, required: true },
    actualWeight: { type: Number },
    rateApplied: { type: Number },
    subtotal: { type: Number },
  },
  { _id: false }
);

const pickupSchema = new mongoose.Schema(
  {
    pickupId: { type: String, required: true, unique: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    collector: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    items: { type: [pickupItemSchema], required: true },
    address: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', required: true },
    addressSnapshot: { type: Object, required: true },
    scheduledDate: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    contactPhone: { type: String, required: true },
    estimatedValueMin: { type: Number, required: true },
    estimatedValueMax: { type: Number, required: true },
    finalAmount: { type: Number },
    status: { type: String, enum: PICKUP_STATUSES, default: 'BOOKED', index: true },
    evidencePhotos: { type: [String], default: [] },
    cancelReason: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Pickup', pickupSchema);
module.exports.PICKUP_STATUSES = PICKUP_STATUSES;
