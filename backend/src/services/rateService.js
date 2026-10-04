const mongoose = require('mongoose');
const ScrapCategory = require('../models/ScrapCategory');
const ScrapItem = require('../models/ScrapItem');
const ScrapPrice = require('../models/ScrapPrice');

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Accepts a category ObjectId, slug, or (case-insensitive) name.
async function resolveCategoryId(category) {
  if (!category) return null;
  if (mongoose.isValidObjectId(category)) return category;
  const re = new RegExp(`^${escapeRegex(category)}$`, 'i');
  const found = await ScrapCategory.findOne({ $or: [{ slug: String(category).toLowerCase() }, { name: re }] });
  return found ? found._id : undefined; // undefined = "asked for a category that doesn't exist"
}

// Items + price range for a city. Powers the public rates page and the chat assistant.
async function fetchRates({ city, search, category } = {}) {
  const itemFilter = { isActive: true };
  if (search) itemFilter.name = { $regex: escapeRegex(search), $options: 'i' };
  if (category) {
    const categoryId = await resolveCategoryId(category);
    if (categoryId === undefined) return [];
    itemFilter.category = categoryId;
  }

  const items = await ScrapItem.find(itemFilter).populate('category', 'name slug');
  const prices = await ScrapPrice.find({
    item: { $in: items.map((i) => i._id) },
    city: city || 'default',
    isActive: true,
  });
  const priceByItem = new Map(prices.map((p) => [String(p.item), p]));

  return items
    .filter((item) => priceByItem.has(String(item._id))) // only items priced in this city
    .map((item) => {
      const price = priceByItem.get(String(item._id));
      return {
        itemId: item._id,
        name: item.name,
        unit: item.unit,
        category: item.category,
        minPrice: price.minPrice,
        maxPrice: price.maxPrice,
        city: price.city,
        lastUpdated: price.updatedAt,
      };
    });
}

// Server-side estimate for [{ itemId, estimatedQuantity }] in a city. Same maths
// the booking wizard shows, so the chat assistant and the booking agree.
async function estimateItems(entries, city) {
  let min = 0;
  let max = 0;
  const lines = [];
  for (const entry of entries) {
    if (!mongoose.isValidObjectId(entry.itemId)) continue;
    const item = await ScrapItem.findById(entry.itemId);
    if (!item) continue;
    const price = await ScrapPrice.findOne({ item: item._id, city, isActive: true });
    const qty = Math.max(0, Number(entry.estimatedQuantity) || 0);
    const lineMin = price ? price.minPrice * qty : 0;
    const lineMax = price ? price.maxPrice * qty : 0;
    min += lineMin;
    max += lineMax;
    lines.push({ item, quantity: qty, priced: Boolean(price), min: lineMin, max: lineMax });
  }
  return { min, max, lines };
}

async function listServiceCities() {
  return (await ScrapPrice.distinct('city', { isActive: true })).sort();
}

module.exports = { fetchRates, estimateItems, listServiceCities, escapeRegex };
