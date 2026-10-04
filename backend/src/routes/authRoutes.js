const express = require('express');
const rateLimit = require('express-rate-limit');
const auth = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate, z, phone, password } = require('../middleware/validate');

const router = express.Router();

const strict = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT || 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please wait a few minutes.' },
});

const email = z.string().trim().toLowerCase().email('Enter a valid email');

router.post(
  '/register',
  strict,
  validate(
    z.object({
      name: z.string().trim().min(2, 'Enter your name').max(80),
      email,
      phone,
      password,
      referralCode: z.string().trim().max(20).optional(),
    })
  ),
  auth.register
);
router.post('/login', strict, validate(z.object({ email, password: z.string().min(1, 'Enter your password') })), auth.login);
router.post('/refresh', auth.refresh);
router.post('/logout', auth.logout);
router.get('/me', protect, auth.me);

router.post('/otp/request', strict, validate(z.object({ phone, purpose: z.enum(['login', 'booking']).optional() })), auth.requestOtp);
router.post(
  '/otp/verify',
  strict,
  validate(
    z.object({
      phone,
      code: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code'),
      name: z.string().trim().max(80).optional(),
      referralCode: z.string().trim().max(20).optional(),
    })
  ),
  auth.verifyOtpLogin
);

router.post('/forgot-password', strict, validate(z.object({ email })), auth.forgotPassword);
router.post(
  '/reset-password',
  strict,
  validate(z.object({ token: z.string().regex(/^[a-f\d]{64}$/, 'Invalid reset link'), password })),
  auth.resetPassword
);
router.post(
  '/change-password',
  protect,
  validate(z.object({ currentPassword: z.string().optional(), newPassword: password })),
  auth.changePassword
);

module.exports = router;
