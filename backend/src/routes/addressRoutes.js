const express = require('express');
const { listAddresses, createAddress, updateAddress, deleteAddress } = require('../controllers/addressController');
const { protect } = require('../middleware/auth');
const { validate, z, pinCode, objectId } = require('../middleware/validate');

const router = express.Router();

const address = z.object({
  country: z.enum(['IN', 'NP']).optional(),
  district: z.string().trim().max(60).optional(),
  ward: z.string().trim().max(10).optional(),
  

  houseNumber: z.string().trim().min(1, 'House / flat number is required').max(60),
  street: z.string().trim().min(1, 'Street is required').max(120),
  locality: z.string().trim().min(1, 'Locality is required').max(120),
  city: z.string().trim().min(2, 'City is required').max(60),
  state: z.string().trim().min(2, 'State is required').max(60),
  pinCode,
  landmark: z.string().trim().max(120).optional(),
  addressType: z.enum(['home', 'work', 'other']).optional(),
  isDefault: z.boolean().optional(),
  location: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }).optional(),
});

router.use(protect);
router.get('/', listAddresses);
router.post('/', validate(address), createAddress);
router.put('/:id', validate(z.object({ id: objectId }), 'params'), validate(address.partial()), updateAddress);
router.delete('/:id', deleteAddress);

module.exports = router;
module.exports.addressSchema = address;
