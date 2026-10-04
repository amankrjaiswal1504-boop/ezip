const express = require('express');
const { getCategories, getItems, getRates } = require('../controllers/scrapController');

const router = express.Router();

router.get('/categories', getCategories);
router.get('/items', getItems);
router.get('/rates', getRates);

module.exports = router;
