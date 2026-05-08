require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// 업로드 디렉토리 자동 생성
['src/uploads/tracks', 'src/uploads/covers'].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

app.use(cors());
app.use(express.json());

// 정적 파일 (커버 이미지)
app.use('/covers', express.static(path.join(__dirname, 'uploads/covers')));

// 라우터
app.use('/api/tracks',     require('./routes/tracks'));
app.use('/api/charts',     require('./routes/charts'));
app.use('/api/categories', require('./routes/categories'));

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '서버 오류가 발생했습니다.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`서버 실행 중: http://localhost:${PORT}`));

module.exports = app;
