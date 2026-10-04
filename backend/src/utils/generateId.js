const crypto = require('crypto');
const Pickup = require('../models/Pickup');

async function generatePickupId() {
  const year = new Date().getFullYear();
  let seq = (await Pickup.countDocuments({})) + 1;
  // Concurrent bookings can race on the count; step forward until free.
  for (let i = 0; i < 20; i += 1) {
    const candidate = `SM-${year}-${String(seq).padStart(6, '0')}`;
    // eslint-disable-next-line no-await-in-loop
    if (!(await Pickup.exists({ pickupId: candidate }))) return candidate;
    seq += 1 + Math.floor(Math.random() * 5);
  }
  return `SM-${year}-${String(Date.now()).slice(-6)}`;
}

function generatePaymentId() {
  return `PAY-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

function shortId(prefix) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
}

module.exports = { generatePickupId, generatePaymentId, shortId };
