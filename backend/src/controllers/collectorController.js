const Pickup = require('../models/Pickup');
const ScrapPrice = require('../models/ScrapPrice');

async function listAssignedPickups(req, res, next) {
  try {
    const pickups = await Pickup.find({ collector: req.user._id })
      .populate('customer', 'name phone')
      .sort({ scheduledDate: 1 });
    res.json({ success: true, data: { pickups } });
  } catch (err) {
    next(err);
  }
}

async function getAssignedPickup(req, res, next) {
  try {
    const pickup = await Pickup.findOne({ pickupId: req.params.id, collector: req.user._id }).populate(
      'customer',
      'name phone'
    );
    if (!pickup) return res.status(404).json({ success: false, message: 'Pickup not found' });
    res.json({ success: true, data: { pickup } });
  } catch (err) {
    next(err);
  }
}

const ALLOWED_TRANSITIONS = {
  ASSIGNED: ['COLLECTOR_ON_THE_WAY', 'CANCELLED'],
  COLLECTOR_ON_THE_WAY: ['ARRIVED', 'CANCELLED'],
  ARRIVED: ['WEIGHING', 'CANCELLED'],
  WEIGHING: ['COMPLETED', 'CANCELLED'],
};

async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    const pickup = await Pickup.findOne({ pickupId: req.params.id, collector: req.user._id });
    if (!pickup) return res.status(404).json({ success: false, message: 'Pickup not found' });

    const allowed = ALLOWED_TRANSITIONS[pickup.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot move from ${pickup.status} to ${status}`,
      });
    }
    pickup.status = status;
    await pickup.save();
    res.json({ success: true, data: { pickup } });
  } catch (err) {
    next(err);
  }
}

// Collector enters actual weights; rate is looked up from admin-controlled ScrapPrice
// (collector cannot set the rate themselves).
async function submitWeighing(req, res, next) {
  try {
    const { weighedItems, rateChoice } = req.body; // weighedItems: [{ itemName, actualWeight }]
    const pickup = await Pickup.findOne({ pickupId: req.params.id, collector: req.user._id });
    if (!pickup) return res.status(404).json({ success: false, message: 'Pickup not found' });
    if (!['ARRIVED', 'WEIGHING'].includes(pickup.status)) {
      return res.status(400).json({ success: false, message: 'Pickup is not ready for weighing' });
    }

    let finalAmount = 0;
    const city = pickup.addressSnapshot.city;

    for (const pickupItem of pickup.items) {
      const submitted = weighedItems.find((w) => w.itemName === pickupItem.itemName);
      if (!submitted) continue;

      const price = await ScrapPrice.findOne({ item: pickupItem.item, city, isActive: true });
      // rateChoice: 'min' | 'max' | 'avg' — defaults to average of the admin-set range.
      let rate = 0;
      if (price) {
        if (rateChoice === 'min') rate = price.minPrice;
        else if (rateChoice === 'max') rate = price.maxPrice;
        else rate = (price.minPrice + price.maxPrice) / 2;
      }

      pickupItem.actualWeight = Number(submitted.actualWeight) || 0;
      pickupItem.rateApplied = rate;
      pickupItem.subtotal = Math.round(pickupItem.actualWeight * rate * 100) / 100;
      finalAmount += pickupItem.subtotal;
    }

    pickup.finalAmount = Math.round(finalAmount * 100) / 100;
    pickup.status = 'WEIGHING';
    await pickup.save();

    res.json({ success: true, data: { pickup } });
  } catch (err) {
    next(err);
  }
}

async function completePickup(req, res, next) {
  try {
    const pickup = await Pickup.findOne({ pickupId: req.params.id, collector: req.user._id });
    if (!pickup) return res.status(404).json({ success: false, message: 'Pickup not found' });
    if (pickup.status !== 'WEIGHING') {
      return res.status(400).json({ success: false, message: 'Weighing must be completed first' });
    }
    if (req.body.evidencePhotos) {
      pickup.evidencePhotos = req.body.evidencePhotos;
    }
    pickup.status = 'COMPLETED';
    await pickup.save();

    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user._id, { $inc: { 'collectorProfile.totalPickupsCompleted': 1 } });

    res.json({ success: true, data: { pickup } });
  } catch (err) {
    next(err);
  }
}

module.exports = { listAssignedPickups, getAssignedPickup, updateStatus, submitWeighing, completePickup };
