const db = require('../config/db');

async function saveSong(req, res) {
  const { custom_title } = req.body;
  if (!custom_title?.trim()) {
    return res.status(400).json({ message: '저장 제목을 입력해주세요.' });
  }

  try {
    await db.query(
      'INSERT INTO saves (user_id, song_id, custom_title) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE custom_title = ?',
      [req.user.id, req.params.id, custom_title.trim(), custom_title.trim()]
    );
    res.status(201).json({ message: '저장되었습니다.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

async function unsaveSong(req, res) {
  try {
    await db.query('DELETE FROM saves WHERE user_id = ? AND song_id = ?', [
      req.user.id,
      req.params.id,
    ]);
    res.json({ message: '저장이 취소되었습니다.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

async function getMySaves(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT sv.id, sv.custom_title, sv.created_at,
              s.id AS song_id, s.title AS original_title, s.cover_path,
              u.nickname AS uploader, g.name AS genre
       FROM saves sv
       JOIN songs s ON sv.song_id = s.id
       JOIN users u ON s.user_id = u.id
       LEFT JOIN genres g ON s.genre_id = g.id
       WHERE sv.user_id = ?
       ORDER BY sv.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

module.exports = { saveSong, unsaveSong, getMySaves };
