const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

function makeStorage(dest) {
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, dest),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuidv4()}${ext}`);
    },
  });
}

const songUpload = multer({
  storage: makeStorage('uploads/songs'),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.mp3', '.wav', '.flac', '.m4a', '.ogg'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('허용되지 않는 오디오 형식입니다.'));
    }
  },
});

const coverUpload = multer({
  storage: makeStorage('uploads/covers'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('허용되지 않는 이미지 형식입니다.'));
    }
  },
});

module.exports = { songUpload, coverUpload };
