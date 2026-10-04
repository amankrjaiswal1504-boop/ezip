require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const ScrapCategory = require('../models/ScrapCategory');
const ScrapItem = require('../models/ScrapItem');
const ScrapPrice = require('../models/ScrapPrice');
const Address = require('../models/Address');
const Pickup = require('../models/Pickup');

const CITY = 'Bengaluru';

const CATEGORY_DATA = [
  {
    name: 'Normal Recyclables',
    items: [
      { name: 'Newspaper', unit: 'kg', min: 12, max: 14 },
      { name: 'Cardboard', unit: 'kg', min: 8, max: 10 },
      { name: 'Office Paper', unit: 'kg', min: 10, max: 12 },
      { name: 'Books', unit: 'kg', min: 8, max: 10 },
      { name: 'Plastic', unit: 'kg', min: 6, max: 9 },
      { name: 'Iron', unit: 'kg', min: 18, max: 22 },
      { name: 'Steel', unit: 'kg', min: 20, max: 25 },
      { name: 'Aluminium', unit: 'kg', min: 100, max: 120 },
      { name: 'Aluminium Can', unit: 'kg', min: 90, max: 110 },
      { name: 'Brass', unit: 'kg', min: 280, max: 320 },
      { name: 'Copper', unit: 'kg', min: 480, max: 550 },
      { name: 'Glass', unit: 'kg', min: 1, max: 2 },
      { name: 'Clothes', unit: 'kg', min: 4, max: 6 },
    ],
  },
  {
    name: 'E-Waste',
    items: [
      { name: 'Laptop', unit: 'piece', min: 200, max: 600 },
      { name: 'Desktop CPU', unit: 'piece', min: 150, max: 400 },
      { name: 'Monitor', unit: 'piece', min: 80, max: 250 },
      { name: 'Printer', unit: 'piece', min: 60, max: 200 },
      { name: 'Scanner', unit: 'piece', min: 40, max: 120 },
      { name: 'Television', unit: 'piece', min: 150, max: 500 },
      { name: 'Tablet', unit: 'piece', min: 50, max: 200 },
      { name: 'Other Electronic Waste', unit: 'kg', min: 20, max: 60 },
    ],
  },
  {
    name: 'Appliances',
    items: [
      { name: 'Refrigerator', unit: 'piece', min: 500, max: 1200 },
      { name: 'Washing Machine', unit: 'piece', min: 400, max: 1000 },
      { name: 'Microwave', unit: 'piece', min: 100, max: 300 },
      { name: 'Air Conditioner', unit: 'piece', min: 600, max: 1500 },
      { name: 'Cooler', unit: 'piece', min: 150, max: 400 },
      { name: 'Fan', unit: 'piece', min: 60, max: 150 },
      { name: 'Geyser', unit: 'piece', min: 150, max: 400 },
      { name: 'UPS', unit: 'piece', min: 100, max: 300 },
      { name: 'Inverter', unit: 'piece', min: 200, max: 500 },
      { name: 'Other Appliances', unit: 'piece', min: 50, max: 200 },
    ],
  },
  {
    name: 'Vehicle Scrap',
    items: [
      { name: 'Bike', unit: 'piece', min: 1500, max: 4000 },
      { name: 'Scooter', unit: 'piece', min: 1500, max: 4000 },
      { name: 'Car', unit: 'piece', min: 15000, max: 40000 },
    ],
  },
];

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function seed() {
  await connectDB();
  console.log('[seed] Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    ScrapCategory.deleteMany({}),
    ScrapItem.deleteMany({}),
    ScrapPrice.deleteMany({}),
    Address.deleteMany({}),
    Pickup.deleteMany({}),
  ]);

  console.log('[seed] Creating users (DEVELOPMENT / DEMO credentials)...');
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@scrapmate.dev',
    phone: '9999900000',
    password: 'Admin@123',
    role: 'admin',
  });

  const collector1 = await User.create({
    name: 'Ramesh Kumar',
    email: 'collector1@scrapmate.dev',
    phone: '9999900001',
    password: 'Collector@123',
    role: 'collector',
    collectorProfile: { city: CITY, vehicleNumber: 'KA-01-AB-1234' },
  });

  const collector2 = await User.create({
    name: 'Suresh Babu',
    email: 'collector2@scrapmate.dev',
    phone: '9999900002',
    password: 'Collector@123',
    role: 'collector',
    collectorProfile: { city: CITY, vehicleNumber: 'KA-01-CD-5678' },
  });

  const customer = await User.create({
    name: 'Demo Customer',
    email: 'customer@scrapmate.dev',
    phone: '9999900003',
    password: 'Customer@123',
    role: 'customer',
  });

  console.log('[seed] Creating scrap categories, items and prices...');
  for (const cat of CATEGORY_DATA) {
    const category = await ScrapCategory.create({
      name: cat.name,
      slug: slugify(cat.name),
    });
    for (const it of cat.items) {
      const item = await ScrapItem.create({
        category: category._id,
        name: it.name,
        unit: it.unit,
      });
      await ScrapPrice.create({
        item: item._id,
        city: CITY,
        minPrice: it.min,
        maxPrice: it.max,
        updatedBy: admin._id,
      });
    }
  }

  console.log('[seed] Creating a sample address and pickup...');
  const address = await Address.create({
    user: customer._id,
    houseNumber: '221B',
    street: 'MG Road',
    locality: 'Indiranagar',
    city: CITY,
    state: 'Karnataka',
    pinCode: '560038',
    landmark: 'Near Metro Station',
    addressType: 'home',
    isDefault: true,
  });

  const ironItem = await ScrapItem.findOne({ name: 'Iron' });
  await Pickup.create({
    pickupId: 'SM-2026-000001',
    customer: customer._id,
    collector: collector1._id,
    items: [{ item: ironItem._id, itemName: 'Iron', estimatedQuantity: 10 }],
    address: address._id,
    addressSnapshot: address.toObject(),
    scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    timeSlot: '10:00 AM - 12:00 PM',
    contactPhone: customer.phone,
    estimatedValueMin: 180,
    estimatedValueMax: 220,
    status: 'ASSIGNED',
  });

  console.log('\n[seed] Done! Demo credentials (DEVELOPMENT ONLY):');
  console.log('  Admin:     admin@scrapmate.dev / Admin@123');
  console.log('  Collector: collector1@scrapmate.dev / Collector@123');
  console.log('  Customer:  customer@scrapmate.dev / Customer@123\n');

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
