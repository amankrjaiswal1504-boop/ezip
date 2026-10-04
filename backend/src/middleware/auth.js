const { verifyToken, COOKIE_NAME } = require('../utils/jwt');
const User = require('../models/User');

function readToken(req) {
  let token = req.cookies?.[COOKIE_NAME];
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  return token;
}

async function loadUser(token) {
  const decoded = verifyToken(token);
  const user = await User.findById(decoded.id).select('+tokenVersion');
  if (!user || !user.isActive) return null;
  // Tokens issued before a password change / "log out everywhere" are rejected.
  if ((decoded.v ?? 0) !== (user.tokenVersion ?? 0)) return null;
  return user;
}

async function protect(req, res, next) {
  try {
    const token = readToken(req);
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const user = await loadUser(token);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token', code: 'TOKEN_EXPIRED' });
  }
}

// Attaches req.user when a valid token is present; never rejects the request.
async function optionalAuth(req, res, next) {
  try {
    const token = readToken(req);
    if (token) {
      const user = await loadUser(token);
      if (user) req.user = user;
    }
  } catch (err) {
    // invalid/expired token: continue as anonymous
  }
  next();
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: insufficient role' });
    }
    next();
  };
}

// Admin area: admins pass everything; staff pass when their role grants the permission.
function requirePermission(...perms) {
  return (req, res, next) => {
    const granted = req.user?.permissions?.() || [];
    if (granted.includes('*') || perms.some((p) => granted.includes(p))) return next();
    return res.status(403).json({ success: false, message: 'Forbidden: missing permission' });
  };
}

module.exports = { protect, optionalAuth, authorize, requirePermission };
