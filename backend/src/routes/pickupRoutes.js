const express = require('express');
const rateLimit = require('express-rate-limit');
const p = require('../controllers/pickupController');
const { protect, authorize } = require('../middleware/auth');
const { validate, z, objectId, isoDate, phone } = require('../middleware/validate');
const { addressSchema } = require('./addressRoutes');

const router = express.Router();

const bookingLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });

const bookingFields = {
  items: z
    .array(
      z.object({
        itemId: objectId,
        estimatedQuantity: z.coerce.number().positive('Quantity must be more than 0').max(100000),
        condition: z.enum(['working', 'not_working', 'damaged']).optional(),
      })
    )
    .min(1, 'Add at least one item')
    .max(30),
  scheduledDate: isoDate,
  timeSlot: z.string().trim().min(3).max(40),
  notes: z.string().trim().max(500).optional(),
  photos: z.array(z.string().url()).max(6).optional(),
  couponCode: z.string().trim().max(30).optional(),
  type: z.enum(['sale', 'donation']).optional(),
  ngoId: objectId.optional(),
};

const idParam = validate(z.object({ id: z.string().regex(/^SM-\d{4}-\d{6}$/i, 'Invalid pickup ID') }), 'params');

// Guest booking (no account yet) — verified by phone OTP.
router.post(
  '/guest',
  bookingLimiter,
  validate(
    z.object({
      ...bookingFields,
      phone,
      code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code'),
      name: z.string().trim().min(2, 'Enter your name').max(80),
      address: addressSchema.omit({ isDefault: true }),
    })
  ),
  p.createGuestPickup
);

router.use(protect);
router.post(
  '/',
  authorize('customer'),
  bookingLimiter,
  validate(z.object({ ...bookingFields, addressId: objectId, contactPhone: phone.optional(), source: z.string().optional() })),
  p.createPickup
);
router.get('/', authorize('customer'), p.listMyPickups);
router.get('/:id', idParam, p.getPickup);
router.get('/:id/receipt.pdf', idParam, p.receipt);
router.get('/:id/certificate/:kind(donation|ewaste)', p.certificate);
router.get('/:id/calendar.ics', authorize('customer'), idParam, p.calendarFile);
router.put('/:id/cancel', authorize('customer'), idParam, validate(z.object({ reason: z.string().trim().max(300).optional() })), p.cancelPickup);
router.put(
  '/:id/reschedule',
  authorize('customer'),
  idParam,
  validate(z.object({ date: isoDate, timeSlot: z.string().trim().min(3).max(40) })),
  p.reschedulePickup
);
router.put(
  '/:id/decision',
  authorize('customer'),
  idParam,
  validate(z.object({ decision: z.enum(['accepted', 'disputed']), note: z.string().trim().max(500).optional() })),
  p.decideAmount
);
router.post(
  '/:id/review',
  authorize('customer'),
  idParam,
  validate(z.object({ rating: z.coerce.number().int().min(1).max(5), comment: z.string().trim().max(1000).optional() })),
  p.reviewPickup
);

module.exports = router;
