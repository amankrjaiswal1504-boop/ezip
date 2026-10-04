const express = require('express');
const {
  listAssignedPickups,
  getAssignedPickup,
  updateStatus,
  submitWeighing,
  completePickup,
} = require('../controllers/collectorController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('collector'));
router.get('/pickups', listAssignedPickups);
router.get('/pickups/:id', getAssignedPickup);
router.put('/pickups/:id/status', updateStatus);
router.put('/pickups/:id/weighing', submitWeighing);
router.put('/pickups/:id/complete', completePickup);

module.exports = router;
