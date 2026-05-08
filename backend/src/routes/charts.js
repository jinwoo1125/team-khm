const express = require('express');
const router = express.Router();
const { getChart } = require('../controllers/chartController');

// GET /api/charts/daily?category_id=1&limit=50
// GET /api/charts/monthly
// GET /api/charts/yearly
router.get('/:period(daily|monthly|yearly)', getChart);

module.exports = router;
