/**
 * 数据库迁移：直接用 Bun:sqlite 创建表
 * 运行：bun src/server/db/migrate.ts
 */
import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const DB_PATH = process.env.DB_PATH ?? "./data/sudoku.db";
mkdirSync(dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.exec("PRAGMA journal_mode = WAL;");

const stmts = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL DEFAULT '小选手',
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

  `CREATE TABLE IF NOT EXISTS lessons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type_code TEXT,
    phase INTEGER NOT NULL,
    title TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    content_json TEXT NOT NULL,
    prerequisite_id INTEGER
  )`,

  `CREATE TABLE IF NOT EXISTS lesson_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    lesson_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'locked',
    started_at TEXT,
    completed_at TEXT,
    UNIQUE(user_id, lesson_id)
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

  // 索引
  `CREATE INDEX IF NOT EXISTS idx_puzzles_type ON puzzles(type_code)`,
  `CREATE INDEX IF NOT EXISTS idx_practice_user ON practice_records(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_practice_type ON practice_records(type_code)`,
  `CREATE INDEX IF NOT EXISTS idx_skill_user ON skill_stats(user_id)`,
];

for (const sql of stmts) {
  db.exec(sql);
}

console.log("✅ 数据库表创建完成");
db.close();
