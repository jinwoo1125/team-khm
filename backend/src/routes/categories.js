const express = require('express');
const router = express.Router();
const { getCategories, getTracksByCategory } = require('../controllers/categoryController');

router.get('/', getCategories);
router.get('/:id/tracks', getTracksByCategory);

module.exports = router;
