const User = require('../models/User');

async function getProfile(req, res) {
  res.json({ success: true, data: { user: req.user.toSafeObject() } });
}

async function updateProfile(req, res, next) {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (phone) user.phone = phone;
    await user.save();
    res.json({ success: true, data: { user: user.toSafeObject() } });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, updateProfile };
