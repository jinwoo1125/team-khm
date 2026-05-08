const db = require('../config/db');
const path = require('path');
const fs = require('fs');

const SONG_FIELDS = `
  s.id, s.title, s.file_path, s.cover_path, s.play_count, s.created_at,
  u.nickname AS uploader,
  g.id AS genre_id, g.name AS genre,
  COUNT(DISTINCT l.id) AS like_count,
  COUNT(DISTINCT c.id) AS comment_count
`;

async function upload(req, res) {
  if (!req.files?.song) {
    return res.status(400).json({ message: '음원 파일이 필요합니다.' });
  }

  const { title, genre_id } = req.body;
  if (!title) return res.status(400).json({ message: '제목을 입력해주세요.' });

  const filePath = req.files.song[0].path.replace(/\\/g, '/');
  const coverPath = req.files.cover ? req.files.cover[0].path.replace(/\\/g, '/') : null;

  try {
    const [result] = await db.query(
      'INSERT INTO songs (user_id, title, file_path, cover_path, genre_id) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, title, filePath, coverPath, genre_id || null]
    );
    res.status(201).json({ id: result.insertId, message: '음원이 업로드되었습니다.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

async function getSongs(req, res) {
  const { genre_id, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let where = '';
  const params = [];
  if (genre_id) {
    where = 'WHERE s.genre_id = ?';
    params.push(genre_id);
  }

  try {
    const [rows] = await db.query(
      `SELECT ${SONG_FIELDS}
       FROM songs s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN genres g ON s.genre_id = g.id
       LEFT JOIN likes l ON s.id = l.song_id
       LEFT JOIN comments c ON s.id = c.song_id
       ${where}
       GROUP BY s.id
       ORDER BY s.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

async function getSong(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT ${SONG_FIELDS}
       FROM songs s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN genres g ON s.genre_id = g.id
       LEFT JOIN likes l ON s.id = l.song_id
       LEFT JOIN comments c ON s.id = c.song_id
       WHERE s.id = ?
       GROUP BY s.id`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: '음원을 찾을 수 없습니다.' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

async function streamSong(req, res) {
  try {
    const [rows] = await db.query('SELECT file_path, user_id FROM songs WHERE id = ?', [
      req.params.id,
    ]);
    if (rows.length === 0) return res.status(404).json({ message: '음원을 찾을 수 없습니다.' });

    const filePath = rows[0].file_path;
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: '파일을 찾을 수 없습니다.' });
    }

    // 재생 기록
    const userId = req.user?.id ?? null;
    await db.query('INSERT INTO plays (user_id, song_id) VALUES (?, ?)', [userId, req.params.id]);
    await db.query('UPDATE songs SET play_count = play_count + 1 WHERE id = ?', [req.params.id]);

    const stat = fs.statSync(filePath);
    const range = req.headers.range;

    if (range) {
      const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
      const start = parseInt(startStr, 10);
      const end = endStr ? parseInt(endStr, 10) : stat.size - 1;
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': end - start + 1,
        'Content-Type': 'audio/mpeg',
      });
      fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, { 'Content-Length': stat.size, 'Content-Type': 'audio/mpeg' });
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

async function deleteSong(req, res) {
  try {
    const [rows] = await db.query('SELECT user_id, file_path, cover_path FROM songs WHERE id = ?', [
      req.params.id,
    ]);
    if (rows.length === 0) return res.status(404).json({ message: '음원을 찾을 수 없습니다.' });
    if (rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: '삭제 권한이 없습니다.' });
    }

    await db.query('DELETE FROM songs WHERE id = ?', [req.params.id]);

    if (fs.existsSync(rows[0].file_path)) fs.unlinkSync(rows[0].file_path);
    if (rows[0].cover_path && fs.existsSync(rows[0].cover_path)) {
      fs.unlinkSync(rows[0].cover_path);
    }

    res.json({ message: '음원이 삭제되었습니다.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

async function getMySongs(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT s.id, s.title, s.cover_path, s.play_count, s.created_at,
              g.name AS genre,
              COUNT(DISTINCT l.id) AS like_count,
              COUNT(DISTINCT c.id) AS comment_count
       FROM songs s
       LEFT JOIN genres g ON s.genre_id = g.id
       LEFT JOIN likes l ON s.id = l.song_id
       LEFT JOIN comments c ON s.id = c.song_id
       WHERE s.user_id = ?
       GROUP BY s.id
       ORDER BY s.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

async function recordStream(req, res) {
  const songId = req.params.id;
  const userId = req.user?.id ?? null;

  try {
    const [songRows] = await db.query('SELECT id FROM songs WHERE id = ?', [songId]);
    if (songRows.length === 0) return res.status(404).json({ message: '음원을 찾을 수 없습니다.' });

    await db.query('INSERT INTO plays (user_id, song_id) VALUES (?, ?)', [userId, songId]);
    await db.query('UPDATE songs SET play_count = play_count + 1 WHERE id = ?', [songId]);

    const [[{ total }]] = await db.query(
      'SELECT play_count AS total FROM songs WHERE id = ?',
      [songId]
    );
    const [[{ daily }]] = await db.query(
      'SELECT COUNT(*) AS daily FROM plays WHERE song_id = ? AND played_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)',
      [songId]
    );

    res.json({ total_streams: total, daily_streams: daily });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

module.exports = { upload, getSongs, getSong, streamSong, deleteSong, getMySongs, recordStream };
