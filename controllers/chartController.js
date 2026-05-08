const db = require('../config/db');

const CHART_FIELDS = `
  s.id, s.title, s.cover_path, s.play_count,
  u.nickname AS uploader,
  g.name AS genre,
  COUNT(DISTINCT l.id) AS like_count,
  COUNT(DISTINCT sv.id) AS save_count,
  (COUNT(DISTINCT p.id) + COUNT(DISTINCT l.id) * 2 + COUNT(DISTINCT sv.id) * 3) AS score
`;

function getDateFilter(period) {
  switch (period) {
    case 'daily':   return "p.played_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)";
    case 'weekly':  return "p.played_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
    case 'monthly': return "p.played_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)";
    case 'yearly':  return "p.played_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)";
    default:        return "1=1";
  }
}

async function getChart(req, res) {
  const { period = 'daily', genre_id, limit = 100 } = req.query;
  const dateFilter = getDateFilter(period);

  let genreFilter = '';
  const params = [Number(limit)];
  if (genre_id) {
    genreFilter = 'AND s.genre_id = ?';
    params.unshift(genre_id);
  }

  try {
    const [rows] = await db.query(
      `SELECT ${CHART_FIELDS}
       FROM songs s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN genres g ON s.genre_id = g.id
       LEFT JOIN likes l ON s.id = l.song_id
       LEFT JOIN saves sv ON s.id = sv.song_id
       LEFT JOIN plays p ON s.id = p.song_id AND ${dateFilter}
       WHERE 1=1 ${genreFilter}
       GROUP BY s.id
       ORDER BY score DESC
       LIMIT ?`,
      params
    );

    res.json({ period, rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

module.exports = { getChart };
