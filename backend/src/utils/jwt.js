const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const SECRET = () => process.env.JWT_SECRET || 'dev_secret';
const COOKIE_NAME = process.env.COOKIE_NAME || 'scrapmate_token';
const REFRESH_COOKIE = 'scrapmate_refresh';
const ACCESS_TTL = process.env.JWT_EXPIRES_IN || '1h';
const REFRESH_TTL_DAYS = Number(process.env.REFRESH_TOKEN_DAYS || 30);

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role, v: user.tokenVersion ?? 0 }, SECRET(), { expiresIn: ACCESS_TTL });
}

function verifyToken(token) {
  return jwt.verify(token, SECRET());
}

function cookieOptions(maxAge) {
  const prod = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: prod,
    // Cross-site deployments (frontend and API on different sites) need SameSite=None.
    sameSite: process.env.COOKIE_SAMESITE || 'lax',
    maxAge,
  };
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, cookieOptions(7 * 24 * 60 * 60 * 1000));
}

function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE, token, { ...cookieOptions(REFRESH_TTL_DAYS * 86400000), path: '/api/auth' });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME);
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
}

function newRefreshToken() {
  const token = crypto.randomBytes(40).toString('hex');
  return { token, hash: hashToken(token), expiresAt: new Date(Date.now() + REFRESH_TTL_DAYS * 86400000) };
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = {
  signToken,
  verifyToken,
  setAuthCookie,
  setRefreshCookie,
  clearAuthCookie,
  newRefreshToken,
  hashToken,
  COOKIE_NAME,
  REFRESH_COOKIE,
};
