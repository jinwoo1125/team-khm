const express = require('express');
const router = express.Router();
const { getChart } = require('../controllers/chartController');

// GET /api/charts?period=daily|monthly|yearly&genre_id=1
router.get('/', getChart);

module.exports = router;
