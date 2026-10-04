const Address = require('../models/Address');

async function listAddresses(req, res, next) {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
    res.json({ success: true, data: { addresses } });
  } catch (err) {
    next(err);
  }
}

async function createAddress(req, res, next) {
  try {
    const payload = { ...req.body, user: req.user._id };
    if (payload.isDefault) {
      await Address.updateMany({ user: req.user._id }, { $set: { isDefault: false } });
    }
    const address = await Address.create(payload);
    res.status(201).json({ success: true, data: { address } });
  } catch (err) {
    next(err);
  }
}

async function updateAddress(req, res, next) {
  try {
    const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
    if (!address) return res.status(404).json({ success: false, message: 'Address not found' });

    if (req.body.isDefault) {
      await Address.updateMany({ user: req.user._id }, { $set: { isDefault: false } });
    }
    Object.assign(address, req.body);
    await address.save();
    res.json({ success: true, data: { address } });
  } catch (err) {
    next(err);
  }
}

async function deleteAddress(req, res, next) {
  try {
    const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!address) return res.status(404).json({ success: false, message: 'Address not found' });
    res.json({ success: true, message: 'Address deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listAddresses, createAddress, updateAddress, deleteAddress };
