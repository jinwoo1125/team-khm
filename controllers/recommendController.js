const db = require('../config/db');

async function getRecommendations(req, res) {
  try {
    const [genreRows] = await db.query(
      'SELECT genre_id FROM user_genres WHERE user_id = ?',
      [req.user.id]
    );

    if (genreRows.length === 0) {
      const [rows] = await db.query(
        `SELECT s.id, s.title, s.cover_path, s.play_count,
                u.nickname AS uploader, g.name AS genre,
                COUNT(DISTINCT l.id) AS like_count
         FROM songs s
         JOIN users u ON s.user_id = u.id
         LEFT JOIN genres g ON s.genre_id = g.id
         LEFT JOIN likes l ON s.id = l.song_id
         GROUP BY s.id
         ORDER BY (s.play_count + COUNT(DISTINCT l.id) * 2) DESC
         LIMIT 20`
      );
      return res.json({ type: 'popular', songs: rows });
    }

    const genreIds = genreRows.map((r) => r.genre_id);
    const placeholders = genreIds.map(() => '?').join(', ');

    const [rows] = await db.query(
      `SELECT s.id, s.title, s.cover_path, s.play_count,
              u.nickname AS uploader, g.name AS genre,
              COUNT(DISTINCT l.id) AS like_count
       FROM songs s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN genres g ON s.genre_id = g.id
       LEFT JOIN likes l ON s.id = l.song_id
       WHERE s.genre_id IN (${placeholders})
       GROUP BY s.id
       ORDER BY (s.play_count + COUNT(DISTINCT l.id) * 2) DESC
       LIMIT 30`,
      genreIds
    );

    res.json({ type: 'personalized', genres: genreIds, songs: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

async function getRandomPlay(req, res) {
  try {
    const [genreRows] = await db.query(
      'SELECT genre_id FROM user_genres WHERE user_id = ?',
      [req.user.id]
    );

    let query;
    let params = [];

    if (genreRows.length > 0) {
      const genreIds = genreRows.map((r) => r.genre_id);
      const placeholders = genreIds.map(() => '?').join(', ');
      query = `SELECT id, title, cover_path, file_path FROM songs WHERE genre_id IN (${placeholders}) ORDER BY RAND() LIMIT 20`;
      params = genreIds;
    } else {
      query = 'SELECT id, title, cover_path, file_path FROM songs ORDER BY RAND() LIMIT 20';
    }

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

module.exports = { getRecommendations, getRandomPlay };
