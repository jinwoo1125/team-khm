const db = require('../config/db');

async function rateSong(req, res) {
  const { id } = req.params;
  const { score } = req.body;
  const userId = req.user.id;

  if (!score || score < 1 || score > 5) {
    return res.status(400).json({ message: '1~5 사이의 별점을 입력해주세요.' });
  }

  try {
    await db.query(
      'INSERT INTO ratings (user_id, song_id, score) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE score = ?',
      [userId, id, score, score]
    );

    const [[{ avg_score, count }]] = await db.query(
      'SELECT AVG(score) AS avg_score, COUNT(*) AS count FROM ratings WHERE song_id = ?',
      [id]
    );

    res.json({ score, avg_score: parseFloat(avg_score).toFixed(1), count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

async function getRating(req, res) {
  const { id } = req.params;
  const userId = req.user?.id ?? null;

  try {
    const [[{ avg_score, count }]] = await db.query(
      'SELECT AVG(score) AS avg_score, COUNT(*) AS count FROM ratings WHERE song_id = ?',
      [id]
    );

    let myScore = null;
    if (userId) {
      const [rows] = await db.query(
        'SELECT score FROM ratings WHERE user_id = ? AND song_id = ?',
        [userId, id]
      );
      if (rows.length > 0) myScore = rows[0].score;
    }

    res.json({ avg_score: avg_score ? parseFloat(avg_score).toFixed(1) : null, count, my_score: myScore });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

module.exports = { rateSong, getRating };
