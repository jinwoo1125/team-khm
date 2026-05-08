const express = require('express');
const router = express.Router();
const { upload, getSongs, getSong, streamSong, deleteSong, getMySongs, recordStream } = require('../controllers/songController');
const { getComments, addComment, deleteComment } = require('../controllers/commentController');
const { toggle: likeToggle, getStatus: likeStatus } = require('../controllers/likeController');
const { saveSong, unsaveSong } = require('../controllers/saveController');
const { authRequired, authOptional } = require('../middleware/auth');
const { multiUpload } = require('../utils/upload');

// 음원 목록 / 업로드
router.get('/', getSongs);
router.post('/', authRequired, multiUpload, upload);

// 내가 올린 곡 (/:id보다 먼저 등록해야 충돌 없음)
router.get('/me', authRequired, getMySongs);

// 단일 음원
router.get('/:id', getSong);
router.delete('/:id', authRequired, deleteSong);
router.get('/:id/stream', authOptional, streamSong);
router.post('/:id/stream', authOptional, recordStream);

// 좋아요
router.post('/:id/like', authRequired, likeToggle);
router.get('/:id/like', authRequired, likeStatus);

// 저장
router.post('/:id/save', authRequired, saveSong);
router.delete('/:id/save', authRequired, unsaveSong);

// 댓글
router.get('/:id/comments', getComments);
router.post('/:id/comments', authRequired, addComment);
router.delete('/:id/comments/:commentId', authRequired, deleteComment);

module.exports = router;
