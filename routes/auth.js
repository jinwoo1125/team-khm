const express = require('express');
const router = express.Router();
const { register, login, me, updateGenres } = require('../controllers/authController');
const { authRequired } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authRequired, me);
router.put('/me/genres', authRequired, updateGenres);

module.exports = router;
