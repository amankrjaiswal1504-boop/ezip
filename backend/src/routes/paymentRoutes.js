const express = require('express');
const { createPayment, verifyPayment, getPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');

const router = express.Router();

router.use(protect);
router.post('/create', validateBody(['pickupId', 'method']), createPayment);
router.post('/verify', validateBody(['paymentId']), verifyPayment);
router.get('/:id', getPayment);

module.exports = router;
