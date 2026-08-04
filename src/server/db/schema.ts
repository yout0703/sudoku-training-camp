/**
 * Drizzle ORM 数据库 Schema
 */
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

// ─── 用户 ───
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().default("小选手"),
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

// ─── 课程 ───
export const lessons = sqliteTable("lessons", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  typeCode: text("type_code"),
  phase: integer("phase").notNull(),
  title: text("title").notNull(),
  sortOrder: integer("sort_order").notNull(),
  contentJson: text("content_json").notNull(),
  prerequisiteId: integer("prerequisite_id"),
});

// ─── 课程进度 ───
export const lessonProgress = sqliteTable("lesson_progress", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  lessonId: integer("lesson_id").notNull(),
  status: text("status").notNull().default("locked"), // locked | available | in_progress | completed
  startedAt: text("started_at"),
  completedAt: text("completed_at"),
});

// ─── 技能统计（按题型聚合，用于薄弱点分析）───
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
