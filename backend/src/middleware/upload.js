const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = file.fieldname === 'cover' ? 'src/uploads/covers' : 'src/uploads/tracks';
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'track') {
    const allowed = ['.mp3', '.wav', '.flac', '.aac', '.ogg'];
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
  } else if (file.fieldname === 'cover') {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

module.exports = upload;
