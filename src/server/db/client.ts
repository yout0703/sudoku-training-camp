/**
 * 数据库连接工厂
 * - createBunDb(): bun:sqlite 本地/测试/自托管
 * - createD1Db():   Cloudflare D1（见 ./d1.ts）
 * 两者 schema 相同，仅供各自运行环境使用。
 */
import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import * as schema from "./schema";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

/** Bun/SQLite 数据库句柄（app.ts 共享 handler 的参数类型；每个环境各建一个） */
export type AppDb = ReturnType<typeof createBunDb>;

/** 创建本地 Bun SQLite 数据库（dev / 测试 / 自托管） */
export function createBunDb(dbPath?: string) {
  const path = dbPath ?? process.env.DB_PATH ?? "./data/sudoku.db";
  mkdirSync(dirname(path), { recursive: true });
  const sqlite = new Database(path);
  sqlite.exec("PRAGMA journal_mode = WAL;");
  sqlite.exec("PRAGMA foreign_keys = ON;");
  return drizzle(sqlite, { schema });
}

export { schema };
