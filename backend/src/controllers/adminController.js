const User = require('../models/User');
const Pickup = require('../models/Pickup');
const ScrapItem = require('../models/ScrapItem');
const ScrapPrice = require('../models/ScrapPrice');
const ScrapCategory = require('../models/ScrapCategory');
const PriceHistory = require('../models/PriceHistory');
const Payment = require('../models/Payment');

async function dashboard(req, res, next) {
  try {
    const [totalCustomers, totalCollectors, pickupsByStatus, totalPaid] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'collector' }),
      Pickup.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Payment.aggregate([
        { $match: { status: 'successful' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const statusMap = Object.fromEntries(pickupsByStatus.map((s) => [s._id, s.count]));
    const totalPickups = Object.values(statusMap).reduce((a, b) => a + b, 0);

    res.json({
      success: true,
      data: {
        totalCustomers,
        totalCollectors,
        totalPickups,
        completedPickups: statusMap.COMPLETED || 0,
        pendingPickups:
          (statusMap.BOOKED || 0) +
          (statusMap.ASSIGNED || 0) +
          (statusMap.COLLECTOR_ON_THE_WAY || 0) +
          (statusMap.ARRIVED || 0) +
          (statusMap.WEIGHING || 0),
        cancelledPickups: statusMap.CANCELLED || 0,
        totalAmountPaid: totalPaid[0]?.total || 0,
        pickupsByStatus: statusMap,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function listUsers(req, res, next) {
  try {
    const filter = { role: 'customer' };
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
      ];
    }
    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: { users } });
  } catch (err) {
    next(err);
  }
}

async function toggleUserActive(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, data: { user: user.toSafeObject() } });
  } catch (err) {
    next(err);
  }
}

async function listCollectors(req, res, next) {
  try {
    const collectors = await User.find({ role: 'collector' }).sort({ createdAt: -1 });
    res.json({ success: true, data: { collectors } });
  } catch (err) {
    next(err);
  }
}

async function createCollector(req, res, next) {
  try {
    const { name, email, phone, password, city, vehicleNumber } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ success: false, message: 'Email already in use' });

    const collector = await User.create({
      name,
      email,
      phone,
      password,
      role: 'collector',
      collectorProfile: { city, vehicleNumber },
    });
    res.status(201).json({ success: true, data: { collector: collector.toSafeObject() } });
  } catch (err) {
    next(err);
  }
}

async function updateCollector(req, res, next) {
  try {
    const collector = await User.findOne({ _id: req.params.id, role: 'collector' });
    if (!collector) return res.status(404).json({ success: false, message: 'Collector not found' });
    const { name, phone, city, vehicleNumber, isActive } = req.body;
    if (name) collector.name = name;
    if (phone) collector.phone = phone;
    if (city) collector.collectorProfile.city = city;
    if (vehicleNumber) collector.collectorProfile.vehicleNumber = vehicleNumber;
    if (typeof isActive === 'boolean') collector.isActive = isActive;
    await collector.save();
    res.json({ success: true, data: { collector: collector.toSafeObject() } });
  } catch (err) {
    next(err);
  }
}

async function listAllPickups(req, res, next) {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.city) filter['addressSnapshot.city'] = req.query.city;
    if (req.query.dateFrom || req.query.dateTo) {
      filter.scheduledDate = {};
      if (req.query.dateFrom) filter.scheduledDate.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) filter.scheduledDate.$lte = new Date(req.query.dateTo);
    }
    const pickups = await Pickup.find(filter)
      .populate('customer', 'name phone')
      .populate('collector', 'name phone')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: { pickups } });
  } catch (err) {
    next(err);
  }
}

async function assignCollector(req, res, next) {
  try {
    const { pickupId, collectorId } = req.body;
    const pickup = await Pickup.findOne({ pickupId });
    if (!pickup) return res.status(404).json({ success: false, message: 'Pickup not found' });
    const collector = await User.findOne({ _id: collectorId, role: 'collector', isActive: true });
    if (!collector) return res.status(404).json({ success: false, message: 'Collector not found or inactive' });

    pickup.collector = collector._id;
    if (pickup.status === 'BOOKED') pickup.status = 'ASSIGNED';
    await pickup.save();
    res.json({ success: true, data: { pickup } });
  } catch (err) {
    next(err);
  }
}

async function createScrapItem(req, res, next) {
  try {
    const { categoryId, name, unit, minPrice, maxPrice, city } = req.body;
    const category = await ScrapCategory.findById(categoryId);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    const item = await ScrapItem.create({ category: category._id, name, unit: unit || 'kg' });

    if (minPrice !== undefined && maxPrice !== undefined && city) {
      await ScrapPrice.create({
        item: item._id,
        city,
        minPrice,
        maxPrice,
        updatedBy: req.user._id,
      });
    }

    res.status(201).json({ success: true, data: { item } });
  } catch (err) {
    next(err);
  }
}

async function updateScrapItem(req, res, next) {
  try {
    const item = await ScrapItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    const { name, unit, isActive, minPrice, maxPrice, city } = req.body;
    if (name) item.name = name;
    if (unit) item.unit = unit;
    if (typeof isActive === 'boolean') item.isActive = isActive;
    await item.save();

    // Optional price update, with history tracking
    if (minPrice !== undefined && maxPrice !== undefined && city) {
      let price = await ScrapPrice.findOne({ item: item._id, city });
      if (price) {
        await PriceHistory.create({
          price: price._id,
          item: item._id,
          city,
          oldMinPrice: price.minPrice,
          oldMaxPrice: price.maxPrice,
          newMinPrice: minPrice,
          newMaxPrice: maxPrice,
          changedBy: req.user._id,
        });
        price.minPrice = minPrice;
        price.maxPrice = maxPrice;
        price.updatedBy = req.user._id;
        await price.save();
      } else {
        price = await ScrapPrice.create({
          item: item._id,
          city,
          minPrice,
          maxPrice,
          updatedBy: req.user._id,
        });
        await PriceHistory.create({
          price: price._id,
          item: item._id,
          city,
          newMinPrice: minPrice,
          newMaxPrice: maxPrice,
          changedBy: req.user._id,
        });
      }
    }

    res.json({ success: true, data: { item } });
  } catch (err) {
    next(err);
  }
}

async function deleteScrapItem(req, res, next) {
  try {
    const item = await ScrapItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    item.isActive = false; // soft delete
    await item.save();
    res.json({ success: true, message: 'Item deactivated' });
  } catch (err) {
    next(err);
  }
}

async function reports(req, res, next) {
  try {
    const { type = 'summary' } = req.query;

    if (type === 'revenue') {
      const data = await Payment.aggregate([
        { $match: { status: 'successful' } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);
      return res.json({ success: true, data: { revenue: data } });
    }

    if (type === 'scrap-by-category') {
      const data = await Pickup.aggregate([
        { $match: { status: 'COMPLETED' } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.itemName',
            totalWeight: { $sum: '$items.actualWeight' },
            totalValue: { $sum: '$items.subtotal' },
          },
        },
        { $sort: { totalWeight: -1 } },
      ]);
      return res.json({ success: true, data: { scrapByItem: data } });
    }

    // default: pickups summary (daily/monthly counts)
    const daily = await Pickup.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    res.json({ success: true, data: { daily } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  dashboard,
  listUsers,
  toggleUserActive,
  listCollectors,
  createCollector,
  updateCollector,
  listAllPickups,
  assignCollector,
  createScrapItem,
  updateScrapItem,
  deleteScrapItem,
  reports,
};
