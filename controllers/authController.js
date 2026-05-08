const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { generateNickname } = require('../utils/nickname');

async function register(req, res) {
  const { email, password, genres } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: '이메일과 비밀번호를 입력해주세요.' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: '이미 사용 중인 이메일입니다.' });
    }

    const hashed = await bcrypt.hash(password, 10);

    let nickname;
    let attempts = 0;
    while (attempts < 10) {
      nickname = generateNickname();
      const [dup] = await conn.query('SELECT id FROM users WHERE nickname = ?', [nickname]);
      if (dup.length === 0) break;
      attempts++;
    }

    const [result] = await conn.query(
      'INSERT INTO users (email, password, nickname) VALUES (?, ?, ?)',
      [email, hashed, nickname]
    );
    const userId = result.insertId;

    if (Array.isArray(genres) && genres.length > 0) {
      const values = genres.map((gId) => [userId, gId]);
      await conn.query('INSERT IGNORE INTO user_genres (user_id, genre_id) VALUES ?', [values]);
    }

    await conn.commit();

    const token = jwt.sign({ id: userId, nickname }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, nickname });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  } finally {
    conn.release();
  }
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: '이메일과 비밀번호를 입력해주세요.' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    const token = jwt.sign({ id: user.id, nickname: user.nickname }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });
    res.json({ token, nickname: user.nickname });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

async function me(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.email, u.nickname, u.created_at,
              JSON_ARRAYAGG(JSON_OBJECT('id', g.id, 'name', g.name)) AS genres
       FROM users u
       LEFT JOIN user_genres ug ON u.id = ug.user_id
       LEFT JOIN genres g ON ug.genre_id = g.id
       WHERE u.id = ?
       GROUP BY u.id`,
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });

    const user = rows[0];
    user.genres = user.genres?.filter((g) => g.id !== null) ?? [];
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

async function updateGenres(req, res) {
  const { genres } = req.body;
  if (!Array.isArray(genres)) {
    return res.status(400).json({ message: 'genres는 배열이어야 합니다.' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM user_genres WHERE user_id = ?', [req.user.id]);

    if (genres.length > 0) {
      const values = genres.map((gId) => [req.user.id, gId]);
      await conn.query('INSERT IGNORE INTO user_genres (user_id, genre_id) VALUES ?', [values]);
    }

    await conn.commit();
    res.json({ message: '관심 장르가 업데이트되었습니다.' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  } finally {
    conn.release();
  }
}

module.exports = { register, login, me, updateGenres };
