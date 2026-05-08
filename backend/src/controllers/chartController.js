const db = require('../config/db');

// 스코어 계산 가중치
const WEIGHT = { play: 1, like: 3 };

async function getChart(req, res) {
  const { period = 'daily' } = req.params;
  const { category_id, limit = 50 } = req.query;

  let dateFilter;
  switch (period) {
    case 'monthly': dateFilter = 'DATE_SUB(NOW(), INTERVAL 1 MONTH)'; break;
    case 'yearly':  dateFilter = 'DATE_SUB(NOW(), INTERVAL 1 YEAR)';  break;
    default:        dateFilter = 'DATE_SUB(NOW(), INTERVAL 1 DAY)';   // daily
  }

  const categoryWhere = category_id ? 'AND t.category_id = ?' : '';
  const params = category_id
    ? [dateFilter, dateFilter, Number(category_id), Number(limit)]
    : [Number(limit)];

  // 재생수 + 좋아요 가중합으로 점수 산정
  const [rows] = await db.execute(
    `SELECT
       t.id, t.title, t.cover_path, t.play_count, t.like_count,
       c.name AS category, u.nickname AS uploader,
       (COUNT(DISTINCT pl.id) * ${WEIGHT.play} + t.like_count * ${WEIGHT.like}) AS score
     FROM tracks t
     LEFT JOIN play_logs pl ON pl.track_id = t.id AND pl.played_at >= DATE_SUB(NOW(), INTERVAL 1 ${period === 'yearly' ? 'YEAR' : period === 'monthly' ? 'MONTH' : 'DAY'})
     LEFT JOIN categories c ON t.category_id = c.id
     LEFT JOIN users u ON t.user_id = u.id
     WHERE 1=1 ${categoryWhere}
     GROUP BY t.id
     ORDER BY score DESC
     LIMIT ?`,
    category_id ? [Number(category_id), Number(limit)] : [Number(limit)]
  );

  res.json({ period, total: rows.length, chart: rows });
}

// 일별 차트 스냅샷 저장 (스케줄러에서 호출)
async function aggregateDailyChart() {
  const today = new Date().toISOString().split('T')[0];

  const [rows] = await db.execute(
    `SELECT
       t.id AS track_id,
       (COUNT(DISTINCT pl.id) * ${WEIGHT.play} + t.like_count * ${WEIGHT.like}) AS score
     FROM tracks t
     LEFT JOIN play_logs pl ON pl.track_id = t.id AND DATE(pl.played_at) = ?
     GROUP BY t.id
     ORDER BY score DESC`,
    [today]
  );

  const values = rows.map((r, i) => [r.track_id, today, r.score, i + 1]);
  if (values.length === 0) return;

  await db.query(
    `INSERT INTO chart_daily (track_id, chart_date, score, rank_pos) VALUES ?
     ON DUPLICATE KEY UPDATE score = VALUES(score), rank_pos = VALUES(rank_pos)`,
    [values]
  );
}

module.exports = { getChart, aggregateDailyChart };
