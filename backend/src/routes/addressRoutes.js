const express = require('express');
const {
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} = require('../controllers/addressController');
const { protect } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');

const router = express.Router();

router.use(protect);
router.get('/', listAddresses);
router.post('/', validateBody(['houseNumber', 'street', 'locality', 'city', 'state', 'pinCode']), createAddress);
router.put('/:id', updateAddress);
router.delete('/:id', deleteAddress);

module.exports = router;
