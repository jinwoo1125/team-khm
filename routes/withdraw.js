const express = require('express');
const router = express.Router();
const { withdraw, getMyWithdrawals } = require('../controllers/withdrawController');
const { authRequired } = require('../middleware/auth');

router.post('/', authRequired, withdraw);
router.get('/me', authRequired, getMyWithdrawals);

module.exports = router;
