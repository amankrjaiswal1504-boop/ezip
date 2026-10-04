const Pickup = require('../models/Pickup');
const { TIME_SLOTS, RESCHEDULABLE_STATUSES } = require('../config/constants');

class PickupActionError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

// Pickups a user may see: customers their own, collectors their assigned, admins any.
function ownershipFilter(user) {
  if (user.role === 'customer') return { customer: user._id };
  if (user.role === 'collector') return { collector: user._id };
  return {};
}

async function findOwnedPickup(user, pickupId) {
  return Pickup.findOne({ pickupId: String(pickupId).toUpperCase(), ...ownershipFilter(user) });
}

async function cancelCustomerPickup(user, pickupId, reason) {
  const pickup = await Pickup.findOne({ pickupId: String(pickupId).toUpperCase(), customer: user._id });
  if (!pickup) throw new PickupActionError('Pickup not found', 404);
  if (['COMPLETED', 'CANCELLED'].includes(pickup.status)) {
    throw new PickupActionError(`Cannot cancel a pickup that is ${pickup.status}`);
  }
  pickup.status = 'CANCELLED';
  pickup.cancelReason = reason || 'Cancelled by customer';
  await pickup.save();
  return pickup;
}

// Returns an error message, or null when (date, slot) is a valid future booking slot.
function validateSlot(date, slot) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) return 'Date must be in YYYY-MM-DD format';
  if (!TIME_SLOTS.includes(slot)) return `Slot must be one of: ${TIME_SLOTS.join(', ')}`;
  const today = new Date().toISOString().split('T')[0];
  if (date < today) return 'Date cannot be in the past';
  return null;
}

async function rescheduleCustomerPickup(user, pickupId, date, slot) {
  const pickup = await Pickup.findOne({ pickupId: String(pickupId).toUpperCase(), customer: user._id });
  if (!pickup) throw new PickupActionError('Pickup not found', 404);
  if (!RESCHEDULABLE_STATUSES.includes(pickup.status)) {
    throw new PickupActionError(`Cannot reschedule a pickup that is ${pickup.status}`);
  }
  const invalid = validateSlot(date, slot);
  if (invalid) throw new PickupActionError(invalid);
  pickup.scheduledDate = new Date(date);
  pickup.timeSlot = slot;
  await pickup.save();
  return pickup;
}

module.exports = {
  PickupActionError,
  ownershipFilter,
  findOwnedPickup,
  cancelCustomerPickup,
  rescheduleCustomerPickup,
  validateSlot,
};
