const express = require('express');
const { register, login, logout, me, forgotPassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');

const router = express.Router();

router.post('/register', validateBody(['name', 'email', 'phone', 'password']), register);
router.post('/login', validateBody(['email', 'password']), login);
router.post('/logout', logout);
router.get('/me', protect, me);
router.post('/forgot-password', validateBody(['email']), forgotPassword);

module.exports = router;
