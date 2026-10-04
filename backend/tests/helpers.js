process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret';
process.env.CHAT_RATE_LIMIT_PER_MIN = '1000';

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../src/models/User');
const ScrapCategory = require('../src/models/ScrapCategory');
const ScrapItem = require('../src/models/ScrapItem');
const ScrapPrice = require('../src/models/ScrapPrice');
const Address = require('../src/models/Address');
const Pickup = require('../src/models/Pickup');
const Faq = require('../src/models/Faq');
const { signToken } = require('../src/utils/jwt');
const { resetCatalogCache } = require('../src/services/chat/catalog');

let mongo;

async function startDb() {
  mongo = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
  await mongoose.connect(mongo.getUri());
}

async function stopDb() {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
}

async function resetDb() {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
  resetCatalogCache();
}

// Minimal world: two customers, an admin, a few priced items, one pickup owned by Alice.
async function seedBasics() {
  const admin = await User.create({ name: 'Admin', email: 'admin@test.dev', phone: '1', password: 'secret12', role: 'admin' });
  const alice = await User.create({ name: 'Alice Rao', email: 'alice@test.dev', phone: '2', password: 'secret12' });
  const bob = await User.create({ name: 'Bob Das', email: 'bob@test.dev', phone: '3', password: 'secret12' });

  const metals = await ScrapCategory.create({ name: 'Normal Recyclables', slug: 'normal-recyclables' });
  const copper = await ScrapItem.create({ category: metals._id, name: 'Copper', unit: 'kg' });
  const newspaper = await ScrapItem.create({ category: metals._id, name: 'Newspaper', unit: 'kg' });
  const fridge = await ScrapItem.create({ category: metals._id, name: 'Refrigerator', unit: 'piece' });
  await ScrapPrice.create([
    { item: copper._id, city: 'Bengaluru', minPrice: 480, maxPrice: 550 },
    { item: newspaper._id, city: 'Bengaluru', minPrice: 12, maxPrice: 14 },
    { item: fridge._id, city: 'Bengaluru', minPrice: 500, maxPrice: 1200 },
    { item: copper._id, city: 'Pune', minPrice: 470, maxPrice: 540 },
  ]);

  const address = await Address.create({
    user: alice._id,
    houseNumber: '1',
    street: 'MG Road',
    locality: 'Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    pinCode: '560038',
    isDefault: true,
  });
  const pickup = await Pickup.create({
    pickupId: 'SM-2026-000001',
    customer: alice._id,
    items: [{ item: newspaper._id, itemName: 'Newspaper', estimatedQuantity: 10 }],
    address: address._id,
    addressSnapshot: address.toObject(),
    scheduledDate: new Date(Date.now() + 2 * 86400000),
    timeSlot: '9:00 AM - 11:00 AM',
    contactPhone: '2',
    estimatedValueMin: 120,
    estimatedValueMax: 140,
    status: 'BOOKED',
  });
  await Faq.create({
    topic: 'payment',
    question: 'How do I get paid?',
    answer: 'Cash, UPI or bank transfer after weighing.',
    keywords: ['payment', 'paid', 'upi'],
  });
  await Faq.syncIndexes();

  return { admin, alice, bob, copper, newspaper, fridge, pickup };
}

const bearer = (user) => `Bearer ${signToken(user)}`;

module.exports = { startDb, stopDb, resetDb, seedBasics, bearer };
