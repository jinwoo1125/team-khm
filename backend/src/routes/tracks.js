const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { uploadTrack, streamTrack, getTrack } = require('../controllers/trackController');

// 음원 업로드
router.post('/', upload.fields([{ name: 'track', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), uploadTrack);

// 음원 스트리밍
router.get('/:id/stream', streamTrack);

// 음원 정보 조회
router.get('/:id', getTrack);

module.exports = router;
