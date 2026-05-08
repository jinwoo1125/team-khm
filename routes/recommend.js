const express = require('express');
const router = express.Router();
const { getRecommendations, getRandomPlay } = require('../controllers/recommendController');
const { authRequired } = require('../middleware/auth');

router.get('/', authRequired, getRecommendations);
router.get('/random', authRequired, getRandomPlay);

module.exports = router;
