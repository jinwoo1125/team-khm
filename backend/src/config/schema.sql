CREATE DATABASE IF NOT EXISTS blind_music CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE blind_music;

CREATE TABLE IF NOT EXISTS users (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  nickname  VARCHAR(50) NOT NULL UNIQUE,
  email     VARCHAR(100) NOT NULL UNIQUE,
  password  VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  cover_image VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS tracks (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  category_id INT,
  title       VARCHAR(100) NOT NULL,
  file_path   VARCHAR(500) NOT NULL,
  cover_path  VARCHAR(500),
  play_count  INT DEFAULT 0,
  like_count  INT DEFAULT 0,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- 재생 이벤트 (일/월/년 차트 집계용)
CREATE TABLE IF NOT EXISTS play_logs (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  track_id   INT NOT NULL,
  user_id    INT,
  played_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS likes (
  user_id   INT NOT NULL,
  track_id  INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, track_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS comments (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  track_id   INT NOT NULL,
  user_id    INT NOT NULL,
  content    TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS saved_tracks (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  track_id     INT NOT NULL,
  custom_title VARCHAR(100),
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY (user_id, track_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
);

-- 일별 차트 캐시 (매일 집계 후 저장)
CREATE TABLE IF NOT EXISTS chart_daily (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  track_id   INT NOT NULL,
  chart_date DATE NOT NULL,
  score      INT DEFAULT 0,
  rank_pos   INT,
  UNIQUE KEY (track_id, chart_date),
  FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
);

-- 초기 카테고리 데이터
INSERT IGNORE INTO categories (name) VALUES
  ('팝'), ('힙합'), ('R&B'), ('발라드'), ('록'), ('재즈'), ('클래식'), ('일렉트로닉');
