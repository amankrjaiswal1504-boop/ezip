const Pickup = require('../models/Pickup');
const ScrapItem = require('../models/ScrapItem');
const settings = require('./settingsService');

const KG_CO2_PER_TREE_YEAR = 21; // a mature tree absorbs roughly 21 kg of CO2 a year

const BADGES = [
  { id: 'first-pickup', label: 'First pickup', test: (s) => s.pickups >= 1 },
  { id: 'five-pickups', label: '5 pickups', test: (s) => s.pickups >= 5 },
  { id: 'kg-50', label: '50 kg recycled', test: (s) => s.kg >= 50 },
  { id: 'kg-250', label: '250 kg recycled', test: (s) => s.kg >= 250 },
  { id: 'ewaste-hero', label: 'E-waste hero', test: (s) => s.ewasteItems >= 3 },
  { id: 'tree-saver', label: '10 trees equivalent', test: (s) => s.trees >= 10 },
  { id: 'donor', label: 'Donated to an NGO', test: (s) => s.donations >= 1 },
];

// Sum kg and CO2 avoided across completed pickups matching filter.
async function computeImpact(filter = {}) {
  const pickups = await Pickup.find({ ...filter, status: 'COMPLETED' }).select('items type').lean();
  const itemIds = [...new Set(pickups.flatMap((p) => p.items.map((i) => String(i.item))))];
  const items = await ScrapItem.find({ _id: { $in: itemIds } }).populate('category', 'slug').lean();
  const byId = new Map(items.map((i) => [String(i._id), i]));
  let kg = 0;
  let co2 = 0;
  let ewasteItems = 0;
  for (const p of pickups) {
    for (const line of p.items) {
      const meta = byId.get(String(line.item));
      const qty = line.actualWeight ?? line.estimatedQuantity ?? 0;
      kg += meta?.unit === 'kg' || !meta ? qty : qty * (meta.kgPerUnit || 1);
      co2 += qty * (meta?.co2PerUnit ?? 1);
      if (meta?.category?.slug === 'e-waste') ewasteItems += meta.unit === 'kg' ? 1 : qty;
    }
  }
  return {
    pickups: pickups.length,
    donations: pickups.filter((p) => p.type === 'donation').length,
    kg: Math.round(kg * 10) / 10,
    co2Kg: Math.round(co2),
    trees: Math.round((co2 / KG_CO2_PER_TREE_YEAR) * 10) / 10,
    ewasteItems,
  };
}

async function tierFor(kg) {
  const { tiers } = await settings.get('loyalty');
  const sorted = [...tiers].sort((a, b) => a.minKg - b.minKg);
  let current = sorted[0];
  let next = null;
  for (const t of sorted) {
    if (kg >= t.minKg) current = t;
    else if (!next) next = t;
  }
  return { current, next, kgToNext: next ? Math.max(0, Math.round((next.minKg - kg) * 10) / 10) : 0 };
}

async function userImpact(userId) {
  const stats = await computeImpact({ customer: userId });
  const tier = await tierFor(stats.kg);
  const badges = BADGES.map((b) => ({ id: b.id, label: b.label, earned: b.test(stats) }));
  return { ...stats, tier, badges };
}

module.exports = { computeImpact, userImpact, tierFor, KG_CO2_PER_TREE_YEAR };
