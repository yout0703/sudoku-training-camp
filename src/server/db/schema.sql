-- Cloudflare D1 建表（幂等）
-- 使用：wrangler d1 execute sudoku-training-camp --file=src/server/db/schema.sql --remote
-- （schema 与 src/server/db/schema.ts 保持一致）

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  password_hash TEXT,
  name TEXT NOT NULL DEFAULT '数独选手',
  avatar_emoji TEXT NOT NULL DEFAULT '🦊',
  age_group TEXT NOT NULL DEFAULT '10-12',
  total_xp INTEGER NOT NULL DEFAULT 0,
  streak_days INTEGER NOT NULL DEFAULT 0,
  last_practice_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);

CREATE TABLE IF NOT EXISTS puzzle_types (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  grid_size INTEGER NOT NULL,
  box_rows INTEGER NOT NULL,
  box_cols INTEGER NOT NULL,
  variant_type TEXT NOT NULL,
  description TEXT NOT NULL,
  rules TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  phase INTEGER NOT NULL,
  sort_order INTEGER NOT NULL,
  is_finals INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS puzzles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type_code TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  givens TEXT NOT NULL,
  solution TEXT NOT NULL,
  data_json TEXT,
  seed INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_puzzles_type ON puzzles(type_code);

CREATE TABLE IF NOT EXISTS user_saved_games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type_code TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  puzzle_id INTEGER,
  givens TEXT NOT NULL,
  user_grid TEXT NOT NULL,
  candidates TEXT NOT NULL,
  elapsed_ms INTEGER NOT NULL DEFAULT 0,
  mistakes INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, type_code, difficulty)
);

CREATE INDEX IF NOT EXISTS idx_saved_user ON user_saved_games(user_id);

CREATE TABLE IF NOT EXISTS practice_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  puzzle_id INTEGER,
  type_code TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  mistakes INTEGER NOT NULL DEFAULT 0,
  hints_used INTEGER NOT NULL DEFAULT 0,
  completed INTEGER NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_practice_user ON practice_records(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_type ON practice_records(type_code);

CREATE TABLE IF NOT EXISTS skill_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type_code TEXT NOT NULL,
  total_attempts INTEGER NOT NULL DEFAULT 0,
  completed_count INTEGER NOT NULL DEFAULT 0,
  total_duration_ms INTEGER NOT NULL DEFAULT 0,
  total_mistakes INTEGER NOT NULL DEFAULT 0,
  total_hints INTEGER NOT NULL DEFAULT 0,
  best_time_ms INTEGER,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, type_code)
);

CREATE INDEX IF NOT EXISTS idx_skill_user ON skill_stats(user_id);
