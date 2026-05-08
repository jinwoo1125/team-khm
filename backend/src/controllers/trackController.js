const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function uploadTrack(req, res) {
  const { title, category_id } = req.body;
  const user_id = req.user?.id || 1; // TODO: 인증 미들웨어 연결 후 교체

  if (!req.files?.track) {
    return res.status(400).json({ error: '음원 파일이 필요합니다.' });
  }

  const file_path = req.files.track[0].path;
  const cover_path = req.files?.cover?.[0]?.path || null;

  const [result] = await db.execute(
    'INSERT INTO tracks (user_id, category_id, title, file_path, cover_path) VALUES (?, ?, ?, ?, ?)',
    [user_id, category_id || null, title, file_path, cover_path]
  );

  res.status(201).json({ id: result.insertId, title, message: '업로드 완료' });
}

async function streamTrack(req, res) {
  const { id } = req.params;

  const [rows] = await db.execute('SELECT file_path FROM tracks WHERE id = ?', [id]);
  if (!rows.length) return res.status(404).json({ error: '음원을 찾을 수 없습니다.' });

  const filePath = path.resolve(rows[0].file_path);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: '파일이 존재하지 않습니다.' });

  const stat = fs.statSync(filePath);
  const range = req.headers.range;

  // 재생 로그 기록 (비동기, 응답 블로킹 없이)
  const user_id = req.user?.id || null;
  db.execute('INSERT INTO play_logs (track_id, user_id) VALUES (?, ?)', [id, user_id])
    .then(() => db.execute('UPDATE tracks SET play_count = play_count + 1 WHERE id = ?', [id]))
    .catch(() => {}); // 로그 실패가 스트리밍을 막지 않도록

  if (range) {
    const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
    const start = parseInt(startStr, 10);
    const end = endStr ? parseInt(endStr, 10) : stat.size - 1;
    const chunkSize = end - start + 1;

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'audio/mpeg',
    });
    fs.createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': stat.size,
      'Content-Type': 'audio/mpeg',
    });
    fs.createReadStream(filePath).pipe(res);
  }
}

async function getTrack(req, res) {
  const { id } = req.params;
  const [rows] = await db.execute(
    `SELECT t.id, t.title, t.play_count, t.like_count, t.cover_path, t.created_at,
            c.name AS category, u.nickname AS uploader
     FROM tracks t
     LEFT JOIN categories c ON t.category_id = c.id
     LEFT JOIN users u ON t.user_id = u.id
     WHERE t.id = ?`,
    [id]
  );
  if (!rows.length) return res.status(404).json({ error: '음원을 찾을 수 없습니다.' });
  res.json(rows[0]);
}

module.exports = { uploadTrack, streamTrack, getTrack };
