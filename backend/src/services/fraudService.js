const Pickup = require('../models/Pickup');
const { Blocklist } = require('../models/platform');
const settings = require('./settingsService');

class FraudBlock extends Error {
  constructor(message) {
    super(message);
    this.status = 403;
  }
}

async function isBlocked({ phone, email, ip, pinCode }) {
  const checks = [
    phone && { type: 'phone', value: String(phone).toLowerCase() },
    email && { type: 'email', value: String(email).toLowerCase() },
    ip && { type: 'ip', value: String(ip).toLowerCase() },
    pinCode && { type: 'pincode', value: String(pinCode) },
  ].filter(Boolean);
  if (!checks.length) return null;
  return Blocklist.findOne({ $or: checks }).lean();
}

// Runs before a booking is created. Throws FraudBlock for hard stops and
// returns soft flags (e.g. "duplicate") that admins see on the pickup.
async function checkBooking(user, { pinCode, items, scheduledDate, ip }) {
  const blocked = await isBlocked({ phone: user.phone, email: user.email, ip, pinCode });
  if (blocked) throw new FraudBlock('Bookings from this account or area are not allowed. Please contact support.');

  const cfg = await settings.get('fraud');
  const active = await Pickup.countDocuments({ customer: user._id, status: { $nin: ['COMPLETED', 'CANCELLED'] } });
  if (active >= cfg.maxActiveBookings) {
    throw new FraudBlock(`You already have ${active} upcoming pickups. Please complete or cancel one first.`);
  }
  const cancelled = await Pickup.countDocuments({
    customer: user._id,
    status: 'CANCELLED',
    cancelledBy: 'customer',
    updatedAt: { $gte: new Date(Date.now() - 30 * 86400000) },
  });
  if (cancelled >= cfg.maxCancellationsPer30Days) {
    throw new FraudBlock('Too many cancelled pickups recently. Please contact support to book.');
  }

  const flags = [];
  const itemIds = (items || []).map((i) => String(i.itemId)).sort().join(',');
  const recent = await Pickup.find({
    customer: user._id,
    status: { $ne: 'CANCELLED' },
    createdAt: { $gte: new Date(Date.now() - cfg.duplicateWindowHours * 3600000) },
  })
    .select('items scheduledDate')
    .lean();
  const dup = recent.some(
    (p) =>
      p.items.map((i) => String(i.item)).sort().join(',') === itemIds &&
      new Date(p.scheduledDate).toISOString().slice(0, 10) === String(scheduledDate).slice(0, 10)
  );
  if (dup) flags.push('duplicate');
  return { flags };
}

module.exports = { checkBooking, isBlocked, FraudBlock };
