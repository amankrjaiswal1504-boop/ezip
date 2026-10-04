const express = require('express');
const scrap = require('../controllers/scrapController');
const { optionalAuth } = require('../middleware/auth');
const { validate, z, objectId } = require('../middleware/validate');

const router = express.Router();

router.get('/categories', scrap.getCategories);
router.get('/items', scrap.getItems);
router.get('/rates', scrap.getRates);
router.get('/cities', scrap.getCities);
router.get('/stats', scrap.publicStats);
router.get('/trends/:itemId', validate(z.object({ itemId: objectId }), 'params'), scrap.getTrend);
router.post(
  '/estimate',
  optionalAuth,
  validate(
    z.object({
      city: z.string().trim().max(60).optional(),
      items: z
        .array(
          z.object({
            itemId: objectId,
            estimatedQuantity: z.coerce.number().positive().max(100000),
            condition: z.enum(['working', 'not_working', 'damaged']).optional(),
          })
        )
        .min(1)
        .max(30),
    })
  ),
  scrap.estimate
);

module.exports = router;
