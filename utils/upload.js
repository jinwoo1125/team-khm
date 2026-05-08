const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const SONG_EXTS = ['.mp3', '.wav', '.flac', '.m4a', '.ogg'];
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];

// fieldname에 따라 저장 경로를 분기하는 단일 storage
const mixedStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, file.fieldname === 'cover' ? 'uploads/covers' : 'uploads/songs');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const multiUpload = multer({
  storage: mixedStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (file.fieldname === 'cover' && IMAGE_EXTS.includes(ext)) return cb(null, true);
    if (file.fieldname === 'song' && SONG_EXTS.includes(ext)) return cb(null, true);
    cb(new Error('허용되지 않는 파일 형식입니다.'));
  },
}).fields([{ name: 'song', maxCount: 1 }, { name: 'cover', maxCount: 1 }]);

module.exports = { multiUpload };
