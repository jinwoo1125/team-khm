const db = require('../config/db');

async function toggle(req, res) {
  const { id: songId } = req.params;
  const userId = req.user.id;

  try {
    const [existing] = await db.query(
      'SELECT id FROM likes WHERE user_id = ? AND song_id = ?',
      [userId, songId]
    );

    if (existing.length > 0) {
      await db.query('DELETE FROM likes WHERE user_id = ? AND song_id = ?', [userId, songId]);
      res.json({ liked: false });
    } else {
      await db.query('INSERT INTO likes (user_id, song_id) VALUES (?, ?)', [userId, songId]);
      res.json({ liked: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

async function getStatus(req, res) {
  try {
    const [rows] = await db.query(
      'SELECT id FROM likes WHERE user_id = ? AND song_id = ?',
      [req.user.id, req.params.id]
    );
    res.json({ liked: rows.length > 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

module.exports = { toggle, getStatus };
