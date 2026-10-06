const Address = require('../models/Address');
const { checkPin } = require('../services/serviceabilityService');

const FIELDS = ['houseNumber', 'street', 'locality', 'city', 'state', 'pinCode', 'landmark', 'addressType', 'isDefault', 'location', 'country', 'district', 'ward'];
const pick = (body) => Object.fromEntries(FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));

async function withServiceability(address) {
  const obj = address.toObject ? address.toObject() : address;
  const service = await checkPin(obj.pinCode, obj.city);
  return { ...obj, serviceable: service.serviceable, serviceReason: service.reason };
}

async function listAddresses(req, res, next) {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
    res.json({ success: true, data: { addresses: await Promise.all(addresses.map(withServiceability)) } });
  } catch (err) {
    next(err);
  }
}

async function createAddress(req, res, next) {
  try {
    const payload = { ...pick(req.body), user: req.user._id };
    const count = await Address.countDocuments({ user: req.user._id });
    if (count >= 10) return res.status(400).json({ success: false, message: 'You can save up to 10 addresses' });
    if (!count) payload.isDefault = true;
    if (payload.isDefault) await Address.updateMany({ user: req.user._id }, { $set: { isDefault: false } });
    const address = await Address.create(payload);
    res.status(201).json({ success: true, data: { address: await withServiceability(address) } });
  } catch (err) {
    next(err);
  }
}

async function updateAddress(req, res, next) {
  try {
    const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
    if (!address) return res.status(404).json({ success: false, message: 'Address not found' });
    const updates = pick(req.body);
    if (updates.isDefault) await Address.updateMany({ user: req.user._id }, { $set: { isDefault: false } });
    Object.assign(address, updates);
    await address.save();
    res.json({ success: true, data: { address: await withServiceability(address) } });
  } catch (err) {
    next(err);
  }
}

async function deleteAddress(req, res, next) {
  try {
    const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!address) return res.status(404).json({ success: false, message: 'Address not found' });
    if (address.isDefault) {
      const next1 = await Address.findOne({ user: req.user._id }).sort({ createdAt: -1 });
      if (next1) await Address.updateOne({ _id: next1._id }, { isDefault: true });
    }
    res.json({ success: true, message: 'Address deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listAddresses, createAddress, updateAddress, deleteAddress };
