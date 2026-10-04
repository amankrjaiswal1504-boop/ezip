const { ServiceArea } = require('../models/platform');
const { escapeRegex } = require('./rateService');

// Is this PIN code (or city) served? Returns the matching area and its minimums.
async function checkPin(pinCode, city) {
  const pin = String(pinCode || '').trim();
  const anyAreas = await ServiceArea.exists({ isActive: true });
  // With no areas configured yet, everything is serviceable (fresh installs).
  if (!anyAreas) return { serviceable: true, area: null, reason: null };

  let area = pin ? await ServiceArea.findOne({ isActive: true, pinCodes: pin }).lean() : null;
  if (!area && city) {
    // A city with an empty PIN list means the whole city is served.
    area = await ServiceArea.findOne({
      isActive: true,
      city: new RegExp(`^${escapeRegex(city)}$`, 'i'),
      pinCodes: { $size: 0 },
    }).lean();
  }
  if (!area) {
    return { serviceable: false, area: null, reason: `We don't pick up from ${pin || city || 'this area'} yet.` };
  }
  return {
    serviceable: true,
    area: { city: area.city, minPickupWeightKg: area.minPickupWeightKg, minPickupValue: area.minPickupValue },
    reason: null,
  };
}

async function listAreas() {
  return ServiceArea.find({ isActive: true }).sort({ city: 1 }).lean();
}

module.exports = { checkPin, listAreas };
