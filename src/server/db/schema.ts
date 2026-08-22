/**
 * Drizzle ORM 数据库 Schema
 */
import { sqliteTable, integer, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// ─── 用户 ───
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash"),
  name: text("name").notNull().default("数独选手"),
  avatarEmoji: text("avatar_emoji").notNull().default("🦊"),
  ageGroup: text("age_group").notNull().default("10-12"),
  totalXp: integer("total_xp").notNull().default(0),
  streakDays: integer("streak_days").notNull().default(0),
  lastPracticeDate: text("last_practice_date"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

// ─── 题型定义 ───
export const puzzleTypes = sqliteTable("puzzle_types", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  gridSize: integer("grid_size").notNull(),
  boxRows: integer("box_rows").notNull(),
  boxCols: integer("box_cols").notNull(),
  variantType: text("variant_type").notNull(),
  description: text("description").notNull(),
  rules: text("rules").notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  phase: integer("phase").notNull(), // 1=入门 2=基础 3=进阶 4=高阶
  sortOrder: integer("sort_order").notNull(),
  isFinals: integer("is_finals", { mode: "boolean" }).notNull().default(false),
});

// ─── 生成的题目 ───
export const puzzles = sqliteTable("puzzles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  typeCode: text("type_code").notNull(),
  difficulty: text("difficulty").notNull().default("medium"),
  givens: text("givens").notNull(), // JSON: number[]
  solution: text("solution").notNull(), // JSON: number[]
  dataJson: text("data_json"), // JSON: VariantData (变体约束)
  seed: integer("seed"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

// ─── 用户进行中进度 / 草稿表 ───
export const userSavedGames = sqliteTable(
  "user_saved_games",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").notNull(),
    typeCode: text("type_code").notNull(),
    difficulty: text("difficulty").notNull().default("medium"),
    puzzleId: integer("puzzle_id"),
    givens: text("givens").notNull(), // JSON
    userGrid: text("user_grid").notNull(), // JSON
    candidates: text("candidates").notNull(), // JSON
    elapsedMs: integer("elapsed_ms").notNull().default(0),
    mistakes: integer("mistakes").notNull().default(0),
    updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
  },
  (table) => ({
    userTypeDiffIdx: uniqueIndex("user_type_diff_idx").on(table.userId, table.typeCode, table.difficulty),
  }),
);

// ─── 练习记录 ───
export const practiceRecords = sqliteTable("practice_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  puzzleId: integer("puzzle_id"),
  typeCode: text("type_code").notNull(),
  difficulty: text("difficulty").notNull(),
  durationMs: integer("duration_ms").notNull().default(0),
  mistakes: integer("mistakes").notNull().default(0),
  hintsUsed: integer("hints_used").notNull().default(0),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  xpEarned: integer("xp_earned").notNull().default(0),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

// ─── 技能统计（按题型聚合）───
export const skillStats = sqliteTable("skill_stats", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  typeCode: text("type_code").notNull(),
  totalAttempts: integer("total_attempts").notNull().default(0),
  completedCount: integer("completed_count").notNull().default(0),
  totalDurationMs: integer("total_duration_ms").notNull().default(0),
  totalMistakes: integer("total_mistakes").notNull().default(0),
  totalHints: integer("total_hints").notNull().default(0),
  bestTimeMs: integer("best_time_ms"),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});
