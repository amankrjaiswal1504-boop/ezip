const express = require('express');
const { createPickup, listMyPickups, getPickup, cancelPickup } = require('../controllers/pickupController');
const { protect, authorize } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');

const router = express.Router();

router.use(protect);
router.post(
  '/',
  authorize('customer'),
  validateBody(['items', 'addressId', 'scheduledDate', 'timeSlot', 'contactPhone']),
  createPickup
);
router.get('/', authorize('customer'), listMyPickups);
router.get('/:id', getPickup);
router.put('/:id/cancel', authorize('customer'), cancelPickup);

module.exports = router;
