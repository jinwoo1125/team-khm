const db = require('../config/db');

async function getComments(req, res) {
  const { page = 1, limit = 30 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const [rows] = await db.query(
      `SELECT c.id, c.content, c.created_at, u.nickname
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.song_id = ?
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
      [req.params.id, Number(limit), Number(offset)]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

async function addComment(req, res) {
  const { content } = req.body;
  if (!content?.trim()) {
    return res.status(400).json({ message: '댓글 내용을 입력해주세요.' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO comments (user_id, song_id, content) VALUES (?, ?, ?)',
      [req.user.id, req.params.id, content.trim()]
    );
    res.status(201).json({ id: result.insertId, message: '댓글이 등록되었습니다.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

async function deleteComment(req, res) {
  try {
    const [rows] = await db.query('SELECT user_id FROM comments WHERE id = ?', [req.params.commentId]);
    if (rows.length === 0) return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
    if (rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: '삭제 권한이 없습니다.' });
    }

    await db.query('DELETE FROM comments WHERE id = ?', [req.params.commentId]);
    res.json({ message: '댓글이 삭제되었습니다.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

module.exports = { getComments, addComment, deleteComment };
