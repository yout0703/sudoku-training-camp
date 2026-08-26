/**
 * Cloudflare Worker 入口（生产部署）
 * - 静态资源由 wrangler `[assets]` 绑定承担（见 wrangler.toml）
 * - `/api/*` 走 Elysia（CloudflareAdapter），数据库用 D1 binding
 */
import { CloudflareAdapter } from "elysia/adapter/cloudflare-worker";
import { env } from "cloudflare:workers";
import { createApp } from "./app";
import { createD1Db } from "./db/d1";
import { setAuthSecret } from "./auth";
import type { AppDb } from "./db/client";

// 注入签名密钥与 D1 数据库（来自 Worker bindings / vars）
setAuthSecret(env.AUTH_SECRET);
const db = createD1Db(env);

// D1 句柄与 Bun/SQLite 句柄在类型上不同（驱动/异步差异），运行时 API 一致，此处做一次收敛 cast
const app = createApp(db as unknown as AppDb, CloudflareAdapter).compile();

export default app;
