const express = require('express');
const rateLimit = require('express-rate-limit');
const chat = require('../controllers/chatController');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Per user (when logged in) or per IP: protects the AI budget from abuse.
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.CHAT_RATE_LIMIT_PER_MIN || 12),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.user ? `user:${req.user._id}` : `ip:${req.ip}`),
  message: { success: false, message: 'You are sending messages too quickly. Please wait a minute.' },
});

router.get('/config', chat.getConfig);
router.get('/history', optionalAuth, chat.getHistory);
router.delete('/history', optionalAuth, chat.clearHistory);
router.post('/', optionalAuth, chatLimiter, chat.sendMessage);
router.post('/actions/:actionId', protect, chatLimiter, chat.resolveAction);

module.exports = router;
