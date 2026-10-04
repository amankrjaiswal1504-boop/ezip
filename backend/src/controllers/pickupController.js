const Pickup = require('../models/Pickup');
const Address = require('../models/Address');
const ScrapItem = require('../models/ScrapItem');
const ScrapPrice = require('../models/ScrapPrice');
const { generatePickupId } = require('../utils/generateId');

// STEP 1-9 of the schedule-pickup flow are handled client-side as a wizard;
// this endpoint receives the final assembled payload and creates the booking.
async function createPickup(req, res, next) {
  try {
    const { items, addressId, scheduledDate, timeSlot, contactPhone, city } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one scrap item is required' });
    }

    const address = await Address.findOne({ _id: addressId, user: req.user._id });
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    let estimatedValueMin = 0;
    let estimatedValueMax = 0;
    const resolvedItems = [];

    for (const entry of items) {
      const item = await ScrapItem.findById(entry.itemId);
      if (!item) continue;
      const price = await ScrapPrice.findOne({ item: item._id, city: city || address.city, isActive: true });
      const qty = Number(entry.estimatedQuantity) || 0;
      const min = price ? price.minPrice * qty : 0;
      const max = price ? price.maxPrice * qty : 0;
      estimatedValueMin += min;
      estimatedValueMax += max;

      resolvedItems.push({
        item: item._id,
        itemName: item.name,
        estimatedQuantity: qty,
      });
    }

    const pickupId = await generatePickupId();

    const pickup = await Pickup.create({
      pickupId,
      customer: req.user._id,
      items: resolvedItems,
      address: address._id,
      addressSnapshot: address.toObject(),
      scheduledDate,
      timeSlot,
      contactPhone,
      estimatedValueMin,
      estimatedValueMax,
      status: 'BOOKED',
    });

    res.status(201).json({ success: true, data: { pickup } });
  } catch (err) {
    next(err);
  }
}

async function listMyPickups(req, res, next) {
  try {
    const pickups = await Pickup.find({ customer: req.user._id })
      .populate('collector', 'name phone')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: { pickups } });
  } catch (err) {
    next(err);
  }
}

async function getPickup(req, res, next) {
  try {
    const filter = { pickupId: req.params.id };
    // customers may only view their own; collectors/admins may view any
    if (req.user.role === 'customer') filter.customer = req.user._id;

    const pickup = await Pickup.findOne(filter)
      .populate('collector', 'name phone')
      .populate('customer', 'name phone email');
    if (!pickup) return res.status(404).json({ success: false, message: 'Pickup not found' });
    res.json({ success: true, data: { pickup } });
  } catch (err) {
    next(err);
  }
}

async function cancelPickup(req, res, next) {
  try {
    const pickup = await Pickup.findOne({ pickupId: req.params.id, customer: req.user._id });
    if (!pickup) return res.status(404).json({ success: false, message: 'Pickup not found' });
    if (['COMPLETED', 'CANCELLED'].includes(pickup.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel a pickup that is ${pickup.status}` });
    }
    pickup.status = 'CANCELLED';
    pickup.cancelReason = req.body.reason || 'Cancelled by customer';
    await pickup.save();
    res.json({ success: true, data: { pickup } });
  } catch (err) {
    next(err);
  }
}

module.exports = { createPickup, listMyPickups, getPickup, cancelPickup };
