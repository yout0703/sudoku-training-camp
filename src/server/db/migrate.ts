/**
 * 数据库迁移：直接用 Bun:sqlite 创建或升级表
 * 支持命令行运行与服务器启动时自动调用
 */
import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export function runMigration(dbPath?: string) {
  const path = dbPath ?? process.env.DB_PATH ?? "./data/sudoku.db";
  mkdirSync(dirname(path), { recursive: true });

  const db = new Database(path);
  db.exec("PRAGMA journal_mode = WAL;");

  // 1. 创建表
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT,
      password_hash TEXT,
      name TEXT NOT NULL DEFAULT '数独选手',
      avatar_emoji TEXT NOT NULL DEFAULT '🦊',
      age_group TEXT NOT NULL DEFAULT '10-12',
      total_xp INTEGER NOT NULL DEFAULT 0,
      streak_days INTEGER NOT NULL DEFAULT 0,
      last_practice_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    `CREATE TABLE IF NOT EXISTS puzzle_types (
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
    )`,

    `CREATE TABLE IF NOT EXISTS puzzles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type_code TEXT NOT NULL,
      difficulty TEXT NOT NULL DEFAULT 'medium',
      givens TEXT NOT NULL,
      solution TEXT NOT NULL,
      data_json TEXT,
      seed INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    `CREATE TABLE IF NOT EXISTS user_saved_games (
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
    )`,

    `CREATE TABLE IF NOT EXISTS practice_records (
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
    )`,

    `CREATE TABLE IF NOT EXISTS skill_stats (
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
    )`,
  ];

  for (const sql of tables) {
    db.exec(sql);
  }

  // 2. 为旧表补充列
  const migrations = [
    "ALTER TABLE users ADD COLUMN username TEXT",
    "ALTER TABLE users ADD COLUMN password_hash TEXT",
  ];

  for (const mig of migrations) {
    try {
      db.exec(mig);
    } catch {
      // 列可能已存在，忽略
    }
  }

  // 3. 补充索引
  const indices = [
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)",
    "CREATE INDEX IF NOT EXISTS idx_puzzles_type ON puzzles(type_code)",
    "CREATE INDEX IF NOT EXISTS idx_practice_user ON practice_records(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_practice_type ON practice_records(type_code)",
    "CREATE INDEX IF NOT EXISTS idx_skill_user ON skill_stats(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_saved_user ON user_saved_games(user_id)",
  ];

  for (const idx of indices) {
    try {
      db.exec(idx);
    } catch {
      // 忽略重复索引
    }
  }

  // 4. 确保 demo 用户有 username
  try {
    db.run("UPDATE users SET username = 'demo' WHERE id = 1 AND (username IS NULL OR username = '')");
    const existing = db.query("SELECT id FROM users WHERE username = 'demo'").get();
    if (!existing) {
      db.run(
        "INSERT INTO users (username, name, avatar_emoji, total_xp, streak_days) VALUES (?, ?, ?, ?, ?)",
        ["demo", "数独达人", "🦊", 120, 3],
      );
    }
  } catch {
    // ignore
  }

  db.close();
}

// 允许直接命令行执行
if (import.meta.main) {
  runMigration();
  console.log("✅ 数据库迁移完成");
}
