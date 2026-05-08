const db = require('../config/db');

const RATE_PER_STREAM = 10; // 스트리밍 1회당 10원

async function withdraw(req, res) {
  const { bank_name, account_number, phone } = req.body;
  if (!bank_name || !account_number || !phone) {
    return res.status(400).json({ message: '은행명, 계좌번호, 전화번호를 모두 입력해주세요.' });
  }

  try {
    // 내 곡들의 총 스트리밍 수 합산
    const [[{ total_streams }]] = await db.query(
      'SELECT COALESCE(SUM(play_count), 0) AS total_streams FROM songs WHERE user_id = ?',
      [req.user.id]
    );

    const amount = total_streams * RATE_PER_STREAM;
    if (amount === 0) {
      return res.status(400).json({ message: '출금 가능한 금액이 없습니다.' });
    }

    await db.query(
      'INSERT INTO withdrawals (user_id, bank_name, account_number, phone, amount) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, bank_name, account_number, phone, amount]
    );

    res.status(201).json({ message: '출금 신청 완료', amount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

async function getMyWithdrawals(req, res) {
  try {
    const [rows] = await db.query(
      'SELECT id, bank_name, account_number, phone, amount, status, created_at FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

module.exports = { withdraw, getMyWithdrawals };
