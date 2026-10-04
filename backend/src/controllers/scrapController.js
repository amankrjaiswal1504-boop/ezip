const ScrapCategory = require('../models/ScrapCategory');
const ScrapItem = require('../models/ScrapItem');
const { fetchRates } = require('../services/rateService');

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
    const rates = await fetchRates({
      city: req.query.city || 'default',
      search: req.query.search,
      category: req.query.category,
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
