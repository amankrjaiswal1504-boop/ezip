const User = require('../models/User');
const { signToken, setAuthCookie, clearAuthCookie } = require('../utils/jwt');

async function register(req, res, next) {
  try {
    const { name, email, phone, password, role } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }
    // Public registration is always 'customer'; collector/admin accounts are created by admin.
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: role === 'customer' ? 'customer' : 'customer',
    });
    const token = signToken(user);
    setAuthCookie(res, token);
    res.status(201).json({ success: true, data: { user: user.toSafeObject(), token } });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }
    const token = signToken(user);
    setAuthCookie(res, token);
    res.json({ success: true, data: { user: user.toSafeObject(), token } });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res) {
  clearAuthCookie(res);
  res.json({ success: true, message: 'Logged out' });
}

async function me(req, res) {
  res.json({ success: true, data: { user: req.user.toSafeObject() } });
}

// Architecture only: in production this would email a reset link.
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    // Always respond the same way to avoid leaking which emails are registered.
    if (user) {
      console.log(`[mock-email] Password reset requested for ${email}. (No SMTP configured — this is a no-op.)`);
    }
    res.json({
      success: true,
      message: 'If that email is registered, a reset link has been sent (mock in dev mode).',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout, me, forgotPassword };
