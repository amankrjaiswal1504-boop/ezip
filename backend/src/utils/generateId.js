const Pickup = require('../models/Pickup');

async function generatePickupId() {
  const year = new Date().getFullYear();
  const count = await Pickup.countDocuments({});
  const seq = String(count + 1).padStart(6, '0');
  const candidate = `SM-${year}-${seq}`;

  // Guard against rare race conditions on concurrent bookings
  const exists = await Pickup.findOne({ pickupId: candidate });
  if (exists) {
    const fallbackSeq = String(count + 1 + Math.floor(Math.random() * 1000)).padStart(6, '0');
    return `SM-${year}-${fallbackSeq}`;
  }
  return candidate;
}

function generatePaymentId() {
  return `PAY-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

module.exports = { generatePickupId, generatePaymentId };
