/**
 * Cloudflare D1 数据库封装（Worker 环境）
 */
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

/** Worker 环境（由 Wrangler 从 bindings/vars 注入） */
export interface WorkerEnv {
  /** D1 数据库 binding，命名见 wrangler.toml `[[d1_databases]] binding` */
  DB: unknown;
  AUTH_SECRET?: string;
}

/** 用 D1 binding 创建 drizzle 句柄（供 worker.ts 使用） */
export function createD1Db(env: { DB: unknown }) {
  // D1 类型在 @cloudflare/workers-types 里是全局接口，为避免与 DOM 全局冲突，
  // 统一经 env.DB（异构 runtime），此处做一次收敛 cast。运行时可安全使用。
  return drizzle(env.DB as any, { schema });
}
