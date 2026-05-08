require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// 업로드 폴더 생성
['uploads/songs', 'uploads/covers'].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 서빙 (커버 이미지)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 라우터
app.use('/api/auth', require('./routes/auth'));
app.use('/api/songs', require('./routes/songs'));
app.use('/api/charts', require('./routes/charts'));
app.use('/api/genres', require('./routes/genres'));
app.use('/api/recommend', require('./routes/recommend'));
app.use('/api/saves', require('./routes/saves'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.status || 500).json({ message: err.message || '서버 오류가 발생했습니다.' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
