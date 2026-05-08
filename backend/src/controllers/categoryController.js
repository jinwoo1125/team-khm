const db = require('../config/db');

async function getCategories(req, res) {
  const [rows] = await db.execute('SELECT id, name, cover_image FROM categories ORDER BY id');
  res.json(rows);
}

async function getTracksByCategory(req, res) {
  const { id } = req.params;
  const { limit = 20, offset = 0 } = req.query;

  const [rows] = await db.execute(
    `SELECT t.id, t.title, t.cover_path, t.play_count, t.like_count, u.nickname AS uploader
     FROM tracks t
     LEFT JOIN users u ON t.user_id = u.id
     WHERE t.category_id = ?
     ORDER BY t.created_at DESC
     LIMIT ? OFFSET ?`,
    [Number(id), Number(limit), Number(offset)]
  );

  res.json({ category_id: Number(id), tracks: rows });
}

module.exports = { getCategories, getTracksByCategory };
