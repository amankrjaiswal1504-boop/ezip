const ScrapCategory = require('../models/ScrapCategory');
const ScrapItem = require('../models/ScrapItem');
const ScrapPrice = require('../models/ScrapPrice');

async function getCategories(req, res, next) {
  try {
    const categories = await ScrapCategory.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: { categories } });
  } catch (err) {
    next(err);
  }
}

async function getItems(req, res, next) {
  try {
    const filter = { isActive: true };
    if (req.query.category) filter.category = req.query.category;
    const items = await ScrapItem.find(filter).populate('category', 'name slug').sort({ name: 1 });
    res.json({ success: true, data: { items } });
  } catch (err) {
    next(err);
  }
}

// Returns items + their price range for a given city, with category grouping.
// This powers the public "Scrap Rate Page".
async function getRates(req, res, next) {
  try {
    const city = req.query.city || 'default';
    const search = req.query.search;

    const itemFilter = { isActive: true };
    if (search) itemFilter.name = { $regex: search, $options: 'i' };
    if (req.query.category) itemFilter.category = req.query.category;

    const items = await ScrapItem.find(itemFilter).populate('category', 'name slug');
    const itemIds = items.map((i) => i._id);

    const prices = await ScrapPrice.find({
      item: { $in: itemIds },
      city,
      isActive: true,
    });
    const priceByItem = new Map(prices.map((p) => [String(p.item), p]));

    const rates = items
      .filter((item) => priceByItem.has(String(item._id))) // only show items with a price for this city
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

    res.json({
      success: true,
      data: {
        rates,
        disclaimer:
          'Indicative price. Final value depends on actual weight/condition and verification.',
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getCategories, getItems, getRates };
