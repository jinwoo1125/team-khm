require('dotenv').config();
const db = require('../config/db');

async function migrate() {
  const [cols] = await db.query("SHOW COLUMNS FROM users LIKE 'avatar_index'");
  if (cols.length === 0) {
    await db.query('ALTER TABLE users ADD COLUMN avatar_index INT DEFAULT 0');
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS withdrawals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      bank_name VARCHAR(50) NOT NULL,
      account_number VARCHAR(50) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      amount BIGINT NOT NULL,
      status ENUM('pending', 'completed', 'rejected') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  console.log('Migration complete');
  process.exit(0);
}

migrate().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
