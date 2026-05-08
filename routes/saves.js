const express = require('express');
const router = express.Router();
const { getMySaves } = require('../controllers/saveController');
const { authRequired } = require('../middleware/auth');

router.get('/me', authRequired, getMySaves);

module.exports = router;
